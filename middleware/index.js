const authenticate = require('./authMiddleware');
const upload = require('./upload');
const uploadGallery = require('./uploadGallery');
// const logger = require('./loggerMiddleware');
// const errorHandler = require('./errorHandler');

module.exports = {
  authenticate,
  upload,
  uploadGallery,
//   logger,
//   errorHandler
};
