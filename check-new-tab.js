const { google } = require('googleapis');

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0';

async function checkTab() {
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
    
    // Get sheet info to find the tab name
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    const targetSheet = response.data.sheets?.find(s => s.properties?.sheetId === 389793034);
    if (targetSheet) {
      console.log('Found tab:', targetSheet.properties?.title);
      
      // Now get data from that tab
      const range = `${targetSheet.properties?.title}!A1:Z10`;
      const dataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: range,
      });

      const rows = dataResponse.data.values;
      if (rows && rows.length > 0) {
        console.log('\nHeader row:');
        console.log(rows[0]);
        console.log('\nFirst 3 data rows:');
        rows.slice(1, 4).forEach((row, i) => {
          console.log(`\nRow ${i+1}:`, row.slice(0, 10));
        });
      }
    } else {
      console.log('Tab with gid 389793034 not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTab();
