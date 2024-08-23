const authenticate = require('./authMiddleware');
const upload = require('./upload');
// const logger = require('./loggerMiddleware');
// const errorHandler = require('./errorHandler');

module.exports = {
  authenticate,
  upload,
//   logger,
//   errorHandler
};
