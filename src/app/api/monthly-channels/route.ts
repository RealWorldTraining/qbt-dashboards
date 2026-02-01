import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const SHEET_ID = '1SvvnNc32S7jSW1GP1bonJAoW0bTuNgHh9ERQo6RgcEY'
const TAB_NAME = 'Monthly Channel Summary'

export async function GET() {
  try {
    const credsJson = process.env.GOOGLE_SHEETS_CREDENTIALS
    if (!credsJson) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 500 })
    }

    const credentials = JSON.parse(
      Buffer.from(credsJson, 'base64').toString('utf-8')
    )

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    
    // Fetch the data from Monthly Channel Summary tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${TAB_NAME}'!A:I`,
    })

    const rows = response.data.values || []
    
    if (rows.length < 2) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    // Parse headers and data
    const headers = rows[0]
    const data = rows.slice(1).map(row => ({
      month: row[0] || '',
      organic_search: parseInt((row[1] || '0').replace(/,/g, '')) || 0,
      direct: parseInt((row[2] || '0').replace(/,/g, '')) || 0,
      paid_search: parseInt((row[3] || '0').replace(/,/g, '')) || 0,
      referral: parseInt((row[4] || '0').replace(/,/g, '')) || 0,
      organic_social: parseInt((row[5] || '0').replace(/,/g, '')) || 0,
      email: parseInt((row[6] || '0').replace(/,/g, '')) || 0,
      other: parseInt((row[7] || '0').replace(/,/g, '')) || 0,
      total: parseInt((row[8] || '0').replace(/,/g, '')) || 0,
    }))

    return NextResponse.json({
      headers,
      data,
      last_updated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching monthly channel data:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
