const { google } = require('googleapis');

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0';
const RANGE = 'Max CPC Recommendations!A1:Z1';

async function checkColumns() {
  try {
    const credsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;
    if (!credsJson) {
      console.error('Missing GOOGLE_SHEETS_CREDENTIALS');
      process.exit(1);
    }

    const credentials = JSON.parse(
      Buffer.from(credsJson, 'base64').toString('utf-8')
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const headers = response.data.values?.[0] || [];
    console.log('Current column order in Max CPC Recommendations:');
    headers.forEach((header, index) => {
      console.log(`${index}: ${header}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkColumns();
