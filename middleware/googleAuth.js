const { google } = require('googleapis');

// google drive client id
// 362343162329-ii67aq25k3dfc306vq33fagt8ne6r415.apps.googleusercontent.com
// Load your credentials JSON
const credentials = require('../credentials/credentials.json');


const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'],
});

module.exports = auth;
