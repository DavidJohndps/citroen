const authenticate = require('./authMiddleware');
const upload = require('./upload');
const uploadGallery = require('./uploadGallery');
const uploadToDrive = require('./uploadToDrive');
// const errorHandler = require('./errorHandler');

module.exports = {
  authenticate,
  upload,
  uploadGallery,
  uploadToDrive,
//   errorHandler
};
