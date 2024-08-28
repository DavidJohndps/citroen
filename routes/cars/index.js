const {Router} = require('express')
const router = Router();
const path = require('path')
const fs = require('fs').promises;

const {authenticate, uploadGallery, upload} = require('../../middleware')

const {Car, CarGallery} = require('../../models');
const { Op } = require('sequelize');

// compareArrays: (originalArray, newArray) => {
//     // Convert arrays to Sets for easier comparison
//     const originalSet = new Set(originalArray);
//     const newSet = new Set(newArray);
  
//     // Find missing elements (elements in originalArray but not in newArray)
//     const missingElements = [...originalSet].filter(item => !newSet.has(item));
  
//     // Find added elements (elements in newArray but not in originalArray)
//     const addedElements = [...newSet].filter(item => !originalSet.has(item));
  
//     return {
//       missingElements,
//       addedElements
//     };
//   }

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

router.post('/add', authenticate, uploadGallery.single('img'), uploadGallery.array('colorImg'), async (req, res) => {
    try {
        const {body: data, file, files} = req
        const {colors, ...rest} = data

        if(!file) {
            res.send({
                success: false,
                message: 'Foto mobil perlu ditambahkan'
            }).status(403);
        }

        if (files.length === 0) {
            res.send({
                success: false,
                message: 'Foto warna mobil perlu ditambahkan'
            }).status(403);
        }

        const car = await Car.create({...rest, img: file.path});

        colors.split(',').map( async (x,index) => {
            const path = files[index].path
            await CarGallery.create({path, color: x, carId: car.id})
            return {name: x, image}
        })

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

router.patch('/change', authenticate, uploadGallery.single('img'), uploadGallery.array('colorImg'), async (req, res) => {
    try {
        const {body: data, file, files} = req
        const { id, addColors, ...rest} = data

        if(!id) {
            res.send({
                success: false,
                message: 'ID mobil tidak ditemukan'
            })
        }
        if (files.length === 0 && addColors) {
            res.send({
                success: false,
                message: 'Foto warna mobil perlu ditambahkan'
            }).status(403);
        }
        if (files.length !== 0 && !addColors) {
            res.send({
                success: false,
                message: 'Nama Foto warna mobil perlu ditambahkan'
            }).status(403);
        }

        const payload = {...rest}

        if(file) payload.img = file.path

        const car =  await Car.update({...rest, img: file.path}, {where: { id }})

        addColors.map( async (x,index) => {
            const path = files[index].path
            await CarGallery.create({path, color: x, carId: car.id})
        })

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

router.patch('/deleteGallery', authenticate, async(req, res) => {
    const {data: {deleteColors, id}} = req
    try {
        if(!id) {
            res.send({
                success: false,
                message: 'ID mobil tidak ditemukan'
            })
        }
        if(deleteColors.length === 0) {
            res.send({
                success: false,
                message: 'Gallery mobil tersebut tidak ditemukan'
            })
        }

        const car = await Car.findOne({
            where: {
                id
            }
        })
        deleteColors.map( async (x) => {
            const gallery = await CarGallery.findOne({
                where: {
                    carId: car.id,
                    color: {
                        [Op.like]: `%${x}`
                    }
                }
            })
            const fullPath = path.join(path.resolve(__dirname, '../../'), gallery.path); // Construct the full file path

            await fs.unlink(fullPath);
        })

        return res.status(200).send({
            success: true,
            message: `Gallery Mobil ${deleteColors.toString()} berhasil didelete`
        })
    } catch (error) {
        console.log(error)
        return res.send({
            success: false,
            message: error.message
        })
    }
})

router.delete('/remove', authenticate, async (req, res) => {
    try {
        const {body: data} = req
        const { id } = data

        if(!id) {
            res.send({
                success: false,
                message: 'ID mobil tidak ditemukan'
            })
        }

        const carData = await Car.findOne({
            where: {
                id
            }
        })

        const fullPath = path.join(path.resolve(__dirname, '../../'), carData.img); // Construct the full file path

        await fs.unlink(fullPath);

        const gallery = await CarGallery.findAll({
            where: {
                carId: carData.id
            }
        })

        gallery.map( async (x) => {
            const galleryPath = path.join(path.resolve(__dirname, '../../'), x.path); // Construct the full file path

            await fs.unlink(galleryPath);
        })

        await CarGallery.destroy({
            where: {
                id: {
                    [Op.in]: gallery.map(x => x.id)
                }
            }
        })

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