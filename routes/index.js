const {Router} = require('express');
const userRoutes = require('./users');
const carRoutes = require('./cars');
const authenticate = require('./authenticate');

const router = Router();

router.use('/authenticate', authenticate);
router.use('/users', userRoutes);
router.use('/cars', carRoutes);

module.exports = router;
