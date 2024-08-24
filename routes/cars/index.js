const {Router} = require('express')
const router = Router();
const path = require('path')
const fs = require('fs').promises;

const {authenticate, uploadGallery} = require('../../middleware')

const {Car} = require('../../models')

router.get('/', async (req, res) => {
    try {
        
        const {query} = req
    
        const data = await Car.findAll({where: {...query}});
    
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

router.post('/add', authenticate, uploadGallery.single('img'), async (req, res) => {
    try {
        const {body: data, file} = req

        if(!file) {
            res.send({
                success: false,
                message: 'Foto mobil perlu ditambahkan'
            }).status(403);
        }
        await Car.create({...data, img: file.path});

        res.send({
            success: true,
            message: 'Mobil berhasil dibuat'
        })
    } catch (error) {
        console.log(error)
        res.send({
            success: false,
            message: error.errors[0].message
        })
    }
})

router.patch('/change', authenticate, uploadGallery.single('img'), async (req, res) => {
    try {
        const {body: data, file} = req
        const { id, ...rest} = data

        if(!file) {
            res.send({
                success: false,
                message: 'Foto mobil perlu ditambahkan'
            }).status(403);
        }

        const userData = await Car.findOne({
            where: {
                id
            }
        })

        await Car.update({...rest, img: file.path}, {where: { id }})

        const fullPath = path.join(path.resolve(__dirname, '../../'), userData.img); // Construct the full file path

        await fs.unlink(fullPath);

        res.send({
            success: true,
            message: 'Mobil berhasil dirubah'
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
        const {body: data} = req
        const { id } = data

        const userData = await Car.findOne({
            where: {
                id
            }
        })

        const fullPath = path.join(path.resolve(__dirname, '../../'), userData.img); // Construct the full file path

        await fs.unlink(fullPath);

        await Car.destroy({
            where:{
                id
            }
        })

        res.send({
            success: true,
            message: 'Mobil berhasil dihapus'
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