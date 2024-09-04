const {Router} = require('express');
const userRoutes = require('./users');
const carRoutes = require('./cars');
const dealerRoutes = require('./dealers');
const facilitiesRoutes = require('./facilities');
const servicesRoutes = require('./services');
const servicePartsRoutes = require('./servicepart');
const authenticate = require('./authenticate');

const router = Router();

router.use('/authenticate', authenticate);
router.use('/users', userRoutes);
router.use('/cars', carRoutes);
router.use('/dealers', dealerRoutes);
router.use('/facilities', facilitiesRoutes);
router.use('/services', servicesRoutes);
router.use('/serviceparts', servicePartsRoutes);

module.exports = router;
