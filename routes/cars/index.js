const {Router} = require('express')
const router = Router();
const path = require('path')
const fs = require('fs').promises;

const {authenticate, uploadGallery, upload} = require('../../middleware')

const {Car, CarGallery, Gallery} = require('../../models');
const { Op, col } = require('sequelize');

const checkElements = (array1, array2) => {
    let allFound = true;
    const set2 = new Set(array2.map(x => x.id));
    array1.forEach(x => {
        if (!set2.has(x)) {
            allFound = false
        }
    });
    return allFound
}

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
    
        const data = await Car.findAll({
            where: {...query},
            include: [
                {
                    model: Gallery,
                    through: {
                        model: CarGallery,
                        attributes: ['type']
                    }
                }
            ]
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

router.post('/add', authenticate, uploadGallery.fields([{name: 'img', maxCount: 1}, {name: 'colorImg'}]), async (req, res) => {
    try {
        const {body: data, files: {img: [file], colorImg: files}} = req
        const {colors, ...rest} = data

        if(!file) {
            return res.send({
                success: false,
                message: 'Foto mobil perlu ditambahkan'
            }).status(403);
        }

        if (files.length === 0) {
            return res.send({
                success: false,
                message: 'Foto warna mobil perlu ditambahkan'
            }).status(403);
        }

        // return res.send({
        //     success: true,
        //     message: 'In Debug Mode'
        // })

        const car = await Car.create({...rest, img: file.path});

        const parsed = JSON.parse(colors)

        parsed.map(async (el, index) => {
            const {name, category} = el
            const path = files[index].path
            const gallery = await Gallery.create({name, path});
            await CarGallery.create({carId: car.id, galleryId: gallery.id, type: category})
        })

        res.send({
            success: true,
            message: 'Mobil berhasil dibuat'
        })
    } catch (error) {
        console.log(error)
        res.send({
            success: false,
            message: error.message
        })
    }
})

router.patch('/change', authenticate, uploadGallery.fields([{name: 'img', maxCount: 1}, {name: 'colorImg'}]), async (req, res) => {
    try {
        const {body: data, files: {img: [file], colorImg: files}} = req
        const { id, colors, ...rest} = data

        if(!id) {
            res.send({
                success: false,
                message: 'ID mobil tidak ditemukan'
            })
        }
        if (files.length === 0 && colors) {
            res.send({
                success: false,
                message: 'Foto warna mobil perlu ditambahkan'
            }).status(403);
        }
        if (files.length !== 0 && !colors) {
            res.send({
                success: false,
                message: 'Nama Foto warna mobil perlu ditambahkan'
            }).status(403);
        }

        const carData = await Car.findOne({
            where: {
                id
            }
        })

        if(!carData) {
            return res.send({
                success: false,
                message: 'Mobil tidak ditemukan'
            })
        }

        const fullPath = path.join(path.resolve(__dirname, '../../'), carData.img); // Construct the full file path

        await fs.unlink(fullPath);

        const payload = {...rest}

        if(file) payload.img = file.path

        await Car.update({...payload}, {where: { id }})

        const parsed = JSON.parse(colors)

        parsed.map(async (el, index) => {
            const {name, category} = el
            const path = files[index].path
            const gallery = await Gallery.create({name, path})
            await CarGallery.create({carId: id, galleryId: gallery.id, type: category})
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
    const {body: {deleteColors, id}} = req
    try {
        if(!id) {
            return res.send({
                success: false,
                message: 'ID mobil tidak ditemukan'
            })
        }
        if(deleteColors.length === 0) {
            return res.send({
                success: false,
                message: 'Gallery mobil tersebut tidak ditemukan'
            })
        }

        const car = await Car.findOne({
            where: {
                id
            },
            include: [
                {
                    model: Gallery
                }
            ]
        })
        if (!checkElements(deleteColors, car.Galleries)) {
            return res.send({
                success: false,
                message: 'Salah satu Gallery mobil tersebut tidak ditemukan'
            })
        }
        deleteColors.map(async (x) => {
            await CarGallery.destroy({
                where: {
                    carId: car.id,
                    galleryId: x
                }
            })
            
            const gallery = car.Galleries.find(y => y.id === x)
            await Gallery.destroy({
                where: {
                    id: gallery.id
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
            },
            include: [
                {
                    model: Gallery
                }
            ]
        })

        if (!carData) {
            res.send({
                success: false,
                message: 'Mobil Tidak Ditemukan'
            })
            return
        }

        const fullPath = path.join(path.resolve(__dirname, '../../'), carData.img); // Construct the full file path

        await fs.unlink(fullPath);

        // console.log({carData})
        const gallery = carData.Galleries

        gallery.map( async (x) => {
            const galleryPath = path.join(path.resolve(__dirname, '../../'), x.path); // Construct the full file path

            await fs.unlink(galleryPath);
            await CarGallery.destroy({where: {id: x.CarGallery.id}})
            await Gallery.destroy({where: {id: x.id}})
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