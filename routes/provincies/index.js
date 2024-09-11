const {Router} = require('express')
const router = Router();

const {Province} = require('../../models')

router.get('/', async (req, res) => {
    try {
        
        const {query: {limit, offset, ...rest}} = req
    
        const data = await Province.findAll({
            limit: parseInt(limit) || 10,
            offset: parseInt(offset) || 0,
            ...rest,
        });
    
        res.send({
            success: true,
            data
        }).status(200);
    } catch (error) {
        console.log({error})
        res.send({
            success: false,
            message: error.message
        }).status(error.code)
    }
});

module.exports = router;