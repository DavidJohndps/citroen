const { google } = require('googleapis');
const fs = require('fs')
const auth = require('./googleAuth')

// Reusable email sending function with template support
const uploadFile = async (imagePath, imageName, type) => {
  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = {
    name: imageName
  };
  if(type === 'ktp') {
    fileMetadata.parents = [process.env.DRIVE_KTP_ID]
  }
  if (type === 'sim') {
    fileMetadata.parents = [process.env.DRIVE_SIM_ID]
  }
  const media = {
    mimeType: 'image/jpeg',
    body: fs.createReadStream(imagePath),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id',
  });

  // Make file public and return its URL
  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return `https://drive.google.com/uc?id=${response.data.id}`; // Return the shareable link
}

module.exports = uploadFile;
