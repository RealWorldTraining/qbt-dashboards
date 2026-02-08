const { google } = require('googleapis');

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0';

async function listTabs() {
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
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    console.log('Bing-related tabs:');
    response.data.sheets?.forEach(sheet => {
      const title = sheet.properties?.title || '';
      if (title.toLowerCase().includes('bing')) {
        console.log(`- ${title} (gid: ${sheet.properties?.sheetId})`);
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listTabs();
