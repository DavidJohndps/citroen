const {Router} = require('express')
const router = Router();

const sendMail = require('../../middleware/mailer')

router.post('/', async (req, res) => {
    try {
        
        const {body: data} = req
        console.log({data})
        // await sendMail({to, subject, text})
    
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