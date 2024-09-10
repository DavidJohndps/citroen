const {Router} = require('express')
const router = Router();

const {authenticate} = require('../../middleware')

const {User} = require('../../models');
const { verifyToken } = require('../../library/jwt');

router.get('/', authenticate, async (req, res) => {
    try {
        
        const {headers: {authorization}} = req

        const token = authorization.split(' ')[1]
        const {id, email} = verifyToken(token)
    
        const data = await User.findAll({where: {
            id: id,
            email: email
        }, attributes: {
            exclude: ['username', 'password']
        }});
    
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