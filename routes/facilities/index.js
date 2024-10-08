const {Router} = require('express')
const router = Router();
const {authenticate, upload} = require('../../middleware')

const {Facility} = require('../../models')

router.get('/', async (req, res) => {
    try {
        
        const {query: {limit, offset, ...rest}} = req

        const payload = {
            offset: parseInt(offset) || 0,
        }
        if(parseInt(limit) && !isNaN(limit)) {
            payload.limit = parseInt(limit) || 10
        }
    
        const data = await Facility.findAll({
            ...payload,
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

router.post('/add', authenticate, async (req, res) => {
    try {
        const {body: data, user} = req

        // role 0: admin, role 1:head, role 2:staff
        const allowedRole = [0,1]
        if (allowedRole.includes(user.role)) {
            return res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah data tersebut'
            }).status(401);
        }
        
        await Facility.create({...data});

        return res.send({
            success: true,
            message: 'Fasilitas berhasil dibuat'
        })
    } catch (error) {
        console.log(error)
        res.send({
            success: false,
            message: error.errors[0].message
        })
    }
})

router.patch('/change', authenticate, async (req, res) => {
    try {
        const {body: data, user} = req
        const {id, ...rest} = data

        // role 0: admin, role 1:head, role 2:staff
        const allowedRole = [0,1]
        if (allowedRole.includes(user.role)) {
            return res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah data tersebut'
            }).status(401);
        }

        const facility = await Facility.findOne({
            where: {
                id
            }
        })

        if(!facility) {
            return res.send({
                success: false,
                message: 'Fasilitas tidak ditemukan'
            }).status(404)
        }

        await Facility.update({...rest}, {where: { id }})

        res.send({
            success: true,
            message: 'Fasilitas berhasil dirubah'
        })
    } catch (error) {
        console.log({error})
        res.send({
            success: false,
            message: error.message
        })
    }
})

router.delete('/remove', authenticate, async (req, res) => {
    try {
        const {body: data, user} = req
        const { id } = data

        const allowedRole = [0,1]
        if (allowedRole.includes(user.role)) {
            return res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah data tersebut'
            }).status(401);
        }

        await Facility.destroy({
            where:{
                id
            }
        })

        res.send({
            success: true,
            message: 'Fasilitas berhasil dihapus'
        })
    } catch (error) {
        console.log({error})
        res.send({
            success: false,
            message: error.message
        })
    }
})

module.exports = router;