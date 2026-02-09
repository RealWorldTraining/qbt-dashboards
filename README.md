# QBT Dashboards

Internal dashboards and analytics for QuickBooks Training.

Real-time marketing performance dashboards powered by Google Sheets (Adveronix) and Google Analytics 4.

**Live at:** https://qbtraining.ai

---

## 📊 Dashboards

### Marketing Dashboards (Adveronix-powered)

- **`/google-ads-summary`** - Google Ads weekly performance summary
  - Weekly spend, conversions, CPA, ROAS
  - Desktop vs Mobile breakdown
  - Campaign-level metrics
  - Data source: `GADS: Account: Weekly (Devices)` + `GADS: Campaign: Weekly (Devices)`

- **`/bing-ads-summary`** - Bing Ads weekly performance summary
  - Weekly spend, conversions, CPA
  - Campaign-level metrics
  - Data source: `BING: Account Summary Weekly` + `Bing: Campaign Weekly`

- **`/ads`** - Combined Paid Ads Dashboard
  - Google Ads + Bing Ads unified view
  - Weekly performance cards
  - Device-level breakdown
  - Data source: Multiple Adveronix tabs

- **`/ads-tv`** - TV-Optimized Marketing Dashboard
  - Large fonts, high contrast for TV displays
  - New visitors, conversions, conversion rate
  - Traffic sources breakdown
  - Top landing pages (GA4 weekly + Google Ads monthly)
  - Data source: GA4 API + Adveronix tabs

### Analytics Dashboard

- **`/ga4`** - Google Analytics 4 Dashboard
  - Traffic sources, channels, landing pages
  - Real-time user metrics
  - Data source: GA4 API

### Finance Dashboard

- **`/recap`** - Monthly P&L Recap
  - Revenue, expenses, profit margins
  - Data source: n8n workflow → Google Sheet

---

## 🏗️ Architecture

### Data Flow

```
Google Sheets (Adveronix) ──→ API Routes ──→ Next.js Pages
      ↓                            ↓              ↓
  Updated daily              Cache 5min      Auto-refresh
  at 4:00 AM CST
```

### Primary Data Source: **Adveronix Google Sheet**

- **Sheet ID:** `1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0`
- **Sheet Name:** "ADVERONIX: Paid Search"
- **Update Schedule:** Daily at 4:00 AM CST (automated via Adveronix)
- **Access:** Google Sheets API (service account)

### Active Tabs

**Google Ads:**
- `GADS: Account: Weekly (Devices)` - Account-level weekly performance
- `GADS: Campaign: Weekly (Devices)` - Campaign performance by device
- `GADS: Landing Page: Monthly (With Campaigns)` - Landing page clicks & conversions

**Bing Ads:**
- `BING: Account Summary Weekly` - Account-level weekly
- `Bing: Campaign Weekly` - Campaign performance

**Google Search Console:**
- `GSC: Account Daily` - Daily impressions/clicks
- `GSC: Query Daily` - Daily keyword data

**Google Analytics 4:**
- `GA4: Traffic Weekly Session Source` - Weekly traffic by source/medium
- `GA4: Traffic Weekly Channel` - Weekly traffic by channel group

### API Routes

All API routes are in `/src/app/api/`:

| Endpoint | Data Source | Description |
|----------|------------|-------------|
| `/api/google-ads-weekly` | `GADS: Account: Weekly (Devices)` | Weekly Google Ads metrics |
| `/api/campaigns` | `GADS: Campaign: Weekly (Devices)` | Campaign performance |
| `/api/bing-ads` | `BING: Account Summary Weekly` + `Bing: Campaign Weekly` | Bing Ads metrics |
| `/api/ads-split` | `GADS: Account: Weekly (Devices)` | Desktop vs Mobile split |
| `/api/organic` | `GA4: Traffic Weekly Session Source` | GA4 traffic sources |
| `/api/organic-yoy` | `GA4: Traffic Weekly Session Source` | Year-over-year traffic |
| `/api/landing-pages-weekly` | `GA4: Traffic Weekly Session Source` | Top GA4 landing pages |
| `/api/gads-landing-pages-monthly` | `GADS: Landing Page: Monthly` | Top Google Ads landing pages |

**Cache Strategy:** API responses are cached for 5 minutes (`Cache-Control: public, s-maxage=300, stale-while-revalidate=60`)

---

## 🚀 Setup

### Prerequisites

- Node.js 18+ (tested on v22.22.0)
- Google Cloud service account with Sheets API access
- Access to the Adveronix Google Sheet

### Installation

```bash
# Clone the repo
git clone https://github.com/RealWorldTraining/qbt-dashboards.git
cd qbt-dashboards

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env.local

# Run development server
npm run dev
```

Visit http://localhost:3000

### Environment Variables

Create `.env.local`:

```bash
# Google Sheets API Credentials (base64 encoded service account JSON)
GOOGLE_SHEETS_CREDENTIALS=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsC...

# Dashboard Authentication
DASHBOARD_USER=admin
DASHBOARD_PASSWORD=your-secure-password

# Optional: n8n webhook for /recap endpoint
RECAP_WEBHOOK_SECRET=your-webhook-secret
```

**Getting Google Sheets Credentials:**

1. Create a Google Cloud service account
2. Enable Google Sheets API
3. Download the JSON key file
4. Base64 encode it: `base64 -i key.json | pbcopy`
5. Paste into `GOOGLE_SHEETS_CREDENTIALS`

---

## 📁 Project Structure

```
qbt-dashboards/
├── src/
│   ├── app/
│   │   ├── google-ads-summary/    # Google Ads dashboard
│   │   │   └── page.tsx
│   │   ├── bing-ads-summary/      # Bing Ads dashboard
│   │   │   └── page.tsx
│   │   ├── ads/                   # Combined paid ads
│   │   │   └── page.tsx
│   │   ├── ads-tv/                # TV-optimized dashboard
│   │   │   └── page.tsx
│   │   ├── ga4/                   # Google Analytics 4
│   │   │   └── page.tsx
│   │   ├── recap/                 # Monthly P&L recap
│   │   │   └── page.tsx
│   │   └── api/                   # API routes
│   │       ├── google-ads-weekly/
│   │       ├── campaigns/
│   │       ├── bing-ads/
│   │       ├── ads-split/
│   │       ├── organic/
│   │       ├── organic-yoy/
│   │       ├── landing-pages-weekly/
│   │       ├── gads-landing-pages-monthly/
│   │       └── recap/
│   ├── components/                # Shared components
│   │   └── DashboardNav.tsx
│   └── middleware.ts              # HTTP Basic Auth
├── public/                        # Static assets
├── .recap-data/                   # Cached recap data
├── n8n-workflows/                 # n8n workflow configs
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🔐 Authentication

All dashboard routes are protected with HTTP Basic Auth via `middleware.ts`.

**Credentials:**
- Username: Set via `DASHBOARD_USER` (default: `admin`)
- Password: Set via `DASHBOARD_PASSWORD`

**Excluded routes:**
- `/api/*` - API routes (for internal use)
- `/_next/*` - Next.js internals
- `/favicon.ico` - Assets

---

## 🚢 Deployment

**Platform:** Railway  
**Auto-deploy:** Push to `main` branch  
**Live URL:** https://qbtraining.ai

### Railway Configuration

**Environment Variables (set in Railway):**
- `GOOGLE_SHEETS_CREDENTIALS` - Base64 encoded service account
- `DASHBOARD_USER` - Basic auth username
- `DASHBOARD_PASSWORD` - Basic auth password

**Build Command:** `npm run build`  
**Start Command:** `npm start`  
**Port:** Auto-detected from Railway

### Manual Deploy

```bash
git push origin main
```

Railway will automatically:
1. Detect the push
2. Build the Next.js app
3. Deploy to production
4. Update the live URL

---

## 🔧 Development

### Adding a New Dashboard

1. **Create the page:**
   ```bash
   mkdir src/app/my-dashboard
   touch src/app/my-dashboard/page.tsx
   ```

2. **Create the API route (if needed):**
   ```bash
   mkdir src/app/api/my-data
   touch src/app/api/my-data/route.ts
   ```

3. **Implement the API route:**
   ```typescript
   import { google } from 'googleapis'
   import { NextResponse } from 'next/server'

   const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
   const RANGE = 'Your Tab Name!A:Z'

   export async function GET() {
     // Fetch from Google Sheets
     // Parse and format data
     // Return JSON
   }
   ```

4. **Build the dashboard page:**
   ```typescript
   'use client'
   import { useEffect, useState } from 'react'

   export default function MyDashboard() {
     const [data, setData] = useState(null)
     
     useEffect(() => {
       fetch('/api/my-data').then(r => r.json()).then(setData)
     }, [])
     
     return <div>Your dashboard content</div>
   }
   ```

5. **Test locally:**
   ```bash
   npm run dev
   # Visit http://localhost:3000/my-dashboard
   ```

6. **Deploy:**
   ```bash
   git add .
   git commit -m "Add new dashboard"
   git push origin main
   ```

### Updating Data Sources

If Adveronix adds new tabs or changes column structure:

1. Update the `RANGE` constant in the API route
2. Adjust the column parsing logic (array indices)
3. Test with real data from the sheet
4. Deploy

---

## 📚 Data Source Details

### Adveronix Sheet Structure

The Adveronix sheet is structured with:
- **One tab per metric/platform** (e.g., `GADS: Account: Weekly (Devices)`)
- **Consistent column headers** (Row 1)
- **Data rows** starting at Row 2
- **Date formats:** YYYY-MM-DD or MM/DD/YYYY
- **Numeric formats:** Comma-separated (e.g., `1,234.56`)
- **Percentages:** With `%` symbol (e.g., `12.34%`)

### Data Freshness

- **Adveronix updates:** Daily at 4:00 AM CST
- **API cache:** 5 minutes
- **Dashboard refresh:** Every 5 minutes (auto)

### Fallback Strategy

If Adveronix data is stale (>24 hours old):
- API routes can fall back to direct API calls (Google Ads API, Bing Ads API)
- Not currently implemented but planned

---

## 🤖 For AI Assistants / LLMs

When working with this codebase:

1. **Data lives in Google Sheets** - The Adveronix sheet is the single source of truth
2. **API routes are the bridge** - They fetch, parse, and cache data
3. **Pages are presentational** - They display data from API routes
4. **No database** - Everything is real-time from sheets
5. **Authentication is required** - All routes are protected except `/api/*`

**Common tasks:**

- **Add a new metric:** Update the API route to read a new column
- **Add a new dashboard:** Create a new page + API route
- **Change data source:** Update the `SHEET_ID` or `RANGE` in the API route
- **Modify layout:** Edit the page component (Tailwind CSS)

**Testing changes:**

```bash
npm run dev              # Start dev server
open http://localhost:3000/your-dashboard
```

**Deploying changes:**

```bash
git add .
git commit -m "Your change description"
git push origin main     # Railway auto-deploys
```

---

## 📝 Notes

- All dashboards use **Tailwind CSS** for styling
- Charts use **Recharts** library
- Date handling uses native JavaScript `Date` (no external libs)
- Numeric formatting uses `toLocaleString()`

---

## 🐛 Troubleshooting

**Dashboard shows "Loading..." forever:**
- Check if `GOOGLE_SHEETS_CREDENTIALS` is set correctly
- Verify the service account has access to the Adveronix sheet
- Check Railway logs for API errors

**Data looks stale:**
- Verify Adveronix last update timestamp (check the sheet directly)
- Clear browser cache (dashboards cache for 5 minutes)
- Check if Railway deployment succeeded

**Authentication not working:**
- Verify `DASHBOARD_USER` and `DASHBOARD_PASSWORD` are set in Railway
- Try incognito/private browsing to clear cached credentials

---

## 📄 License

Internal use only - QuickBooks Training

---

**Last updated:** February 9, 2026  
**Maintained by:** Professor (Clawdbot AI) 🎓
