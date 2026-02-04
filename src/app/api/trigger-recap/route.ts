import { NextResponse } from 'next/server'

// Proxy endpoint to trigger the n8n P&L Recap workflow
// This avoids CORS issues when calling n8n from the browser

const N8N_WEBHOOK_URL = 'https://n8n.srv1266620.hstgr.cloud/webhook/recap-refresh'

export async function POST() {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        triggered: 'manual', 
        timestamp: new Date().toISOString(),
        source: 'qbtraining.ai'
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json(
        { error: `n8n returned ${response.status}`, details: text },
        { status: response.status }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'P&L Recap workflow triggered successfully' 
    })
  } catch (error) {
    console.error('Failed to trigger n8n webhook:', error)
    return NextResponse.json(
      { error: 'Failed to trigger workflow', details: String(error) },
      { status: 500 }
    )
  }
}
