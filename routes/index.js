const {Router} = require('express');
const userRoutes = require('./users');
const authenticate = require('./authenticate');

const router = Router();

router.use('/users', userRoutes);
router.use('/authenticate', authenticate);

module.exports = router;
