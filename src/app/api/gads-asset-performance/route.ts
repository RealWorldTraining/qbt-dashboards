import { NextResponse } from "next/server"

interface AssetRow {
  assetText: string
  assetType: string
  fieldType: string
  performanceLabel: string
  campaign: string
  adGroup: string
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  cost: number
}

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OAuth token exchange failed: ${err}`)
  }
  const data = await res.json()
  return data.access_token
}

async function queryGoogleAds(accessToken: string, query: string): Promise<any[]> {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "")
  const url = `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:searchStream`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Ads API error: ${err}`)
  }

  const data = await res.json()
  const rows: any[] = []
  for (const batch of data) {
    if (batch.results) rows.push(...batch.results)
  }
  return rows
}

function parseFieldType(raw: string): string {
  if (!raw) return "UNKNOWN"
  return raw.replace("ASSET_FIELD_TYPE_", "").replace(/_/g, " ")
}

function parsePerformanceLabel(raw: string): string {
  if (!raw) return "N/A"
  return raw.replace("ASSET_PERFORMANCE_LABEL_", "").replace(/_/g, " ")
}

function parseAssetType(raw: string): string {
  if (!raw) return "UNKNOWN"
  return raw.replace("ASSET_TYPE_", "").replace(/_/g, " ")
}

export async function GET() {
  try {
    const accessToken = await getAccessToken()

    // Query 1: RSA assets (headlines, descriptions)
    const rsaQuery = `
      SELECT
        ad_group_ad_asset_view.field_type,
        ad_group_ad_asset_view.performance_label,
        asset.text_asset.text, asset.type, asset.resource_name,
        ad_group.name, campaign.name,
        metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
      FROM ad_group_ad_asset_view
      WHERE segments.date DURING LAST_30_DAYS
        AND ad_group_ad_asset_view.enabled = TRUE
      ORDER BY metrics.impressions DESC
    `

    // Query 2: Campaign-level extensions
    const extensionQuery = `
      SELECT
        campaign_asset.field_type,
        asset.text_asset.text, asset.type,
        asset.sitelink_asset.link_text, asset.callout_asset.callout_text,
        asset.structured_snippet_asset.header, asset.structured_snippet_asset.values,
        campaign.name,
        metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
      FROM campaign_asset
      WHERE segments.date DURING LAST_30_DAYS
      ORDER BY metrics.impressions DESC
    `

    const [rsaRows, extensionRows] = await Promise.all([
      queryGoogleAds(accessToken, rsaQuery),
      queryGoogleAds(accessToken, extensionQuery),
    ])

    const assets: AssetRow[] = []

    // Process RSA results
    for (const row of rsaRows) {
      const impressions = Number(row.metrics?.impressions || 0)
      const clicks = Number(row.metrics?.clicks || 0)
      const costMicros = Number(row.metrics?.costMicros || 0)
      const conversions = Number(row.metrics?.conversions || 0)

      assets.push({
        assetText: row.asset?.textAsset?.text || "(no text)",
        assetType: parseAssetType(row.asset?.type || ""),
        fieldType: parseFieldType(row.adGroupAdAssetView?.fieldType || ""),
        performanceLabel: parsePerformanceLabel(row.adGroupAdAssetView?.performanceLabel || ""),
        campaign: row.campaign?.name || "",
        adGroup: row.adGroup?.name || "",
        impressions,
        clicks,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        conversions,
        cost: costMicros / 1_000_000,
      })
    }

    // Process extension results
    for (const row of extensionRows) {
      const impressions = Number(row.metrics?.impressions || 0)
      const clicks = Number(row.metrics?.clicks || 0)
      const costMicros = Number(row.metrics?.costMicros || 0)
      const conversions = Number(row.metrics?.conversions || 0)

      // Determine text from various asset types
      let text = row.asset?.textAsset?.text
        || row.asset?.sitelinkAsset?.linkText
        || row.asset?.calloutAsset?.calloutText
        || ""

      if (row.asset?.structuredSnippetAsset?.header) {
        const vals = row.asset.structuredSnippetAsset.values || []
        text = `${row.asset.structuredSnippetAsset.header}: ${vals.join(", ")}`
      }

      assets.push({
        assetText: text || "(no text)",
        assetType: parseAssetType(row.asset?.type || ""),
        fieldType: parseFieldType(row.campaignAsset?.fieldType || ""),
        performanceLabel: "N/A",
        campaign: row.campaign?.name || "",
        adGroup: "",
        impressions,
        clicks,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        conversions,
        cost: costMicros / 1_000_000,
      })
    }

    // Build summary
    const byType: Record<string, number> = {}
    const byPerformanceLabel: Record<string, number> = {}
    for (const a of assets) {
      byType[a.fieldType] = (byType[a.fieldType] || 0) + 1
      byPerformanceLabel[a.performanceLabel] = (byPerformanceLabel[a.performanceLabel] || 0) + 1
    }

    return NextResponse.json(
      {
        assets,
        summary: {
          totalAssets: assets.length,
          byType,
          byPerformanceLabel,
        },
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
        },
      }
    )
  } catch (err: any) {
    console.error("gads-asset-performance error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to fetch asset performance" },
      { status: 500 }
    )
  }
}
