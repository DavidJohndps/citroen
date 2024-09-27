const {Router} = require('express')
const router = Router();
const path = require('path')
const fs = require('fs').promises;

const {authenticate, uploadGallery, upload} = require('../../middleware')

const {Car, CarGallery, Gallery, Province} = require('../../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize')

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

const isValid = (string) => {
    try {
        JSON.parse(string)
        return true
    } catch (error) {
        return false
    }
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
        
        const {query: {limit, offset, id, ...rest}} = req

        const payload = {
            limit: parseInt(limit) || 10,
            offset: parseInt(offset) || 0,
        }
        if (id) payload.where = {id}
        const data = await Car.findAll({
            ...payload,
            ...rest,
            include: [
                // Car prices in each region
                {
                  model: Gallery,
                  attributes: ['id', 'name', 'path'],
                  through: {
                    model: CarGallery,
                    attributes: ['type', 'price']
                  },
                },
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
    // const transaction = await sequelize.Transaction()
    try {
        const {body: data, user, files: {img: [file], colorImg: files}} = req
        const {colors, accessory, ...rest} = data

        if (user.role !== '0') {
            return res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah data tersebut'
            }).status(401);
        }

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

        if(!accessory) {
            return res.send({
                success: false,
                message: 'Harga Accessory per Region perlu ditambahkan'
            })
        }

        if(!isValid(accessory)) {
            return res.send({
                success: false,
                message: "Format Harga Accessory per Region tidak sesuai"
            })
        }
        if(!colors) {
            return res.send({
                success: false,
                message: 'Harga Warna per Region perlu ditambahkan'
            })
        }

        if(!isValid(colors)) {
            return res.send({
                success: false,
                message: "Format Harga Warna per Region tidak sesuai"
            })
        }

        // console.log({file, files, rest, colors})

        // return res.send({
        //     success: true,
        //     message: 'In Debug Mode'
        // })

        // parsing all the stringified data
        const parsedColors = JSON.parse(colors)
        const parsedAccessory = JSON.parse(accessory)
        const combined = [...parsedColors, ...parsedAccessory]
        const provinces = combined.reduce((acc, item) => {
            const {prices} = item
            prices.map(x => {
                if (!acc.includes(x.provinceId)) acc.push(x.provinceId)
            })
            return acc
        }, [])

        const provinceData = await Province.findAll({ where: { id: { [Op.in]: provinces } } })
        if(!provinceData) {
            return res.send({
                success: false,
                message: 'Salah Satu Provinsi tidak ditemukan'
            }).status(404)
        }
        const provinceMap = provinceData.reduce((acc, item) => {
            const key = item.id
            if (!acc[key]) acc[key] = item
            return acc
        }, {})

        // verify all parsed json have valid property
        const carGalleryPayload = []
        const mappedColor = parsedColors.map( async (pricing, index) => {
            const {name, category, prices} = pricing
            const mapped = prices.map(x => {
                if (!x.provinceId) {
                    return res.send({
                        success: false,
                        message: 'Format harga tidak sesuai, tidak ada provinsi'
                    }).status(500)
                }
                if (!x.price) {
                    return res.send({
                        success: false,
                        message: 'Format harga tidak sesuai, tidak ada harga'
                    }).status(500)
                }
                const province = provinceMap[x.provinceId]?.name
                return {
                    ...x,
                    provinceName: province
                }
            })
            const path = files[index].path
            const gallery = await Gallery.create({name, path});
            carGalleryPayload.push({carId: null, galleryId: gallery.id, type: category, price: prices})
            // await CarGallery.create({carId: car.id, galleryId: gallery.id, type: category}, {transaction})
            return {
                name,
                prices: mapped,
                category
            }
        })
        const mappedAccessory = parsedAccessory.map(accessory => {
            const {name, desc, prices} = accessory
            const maped = prices.map(x => {
                const province = provinceMap[x.provinceId]
                if (!x.provinceId) {
                    return res.send({
                        success: false,
                        message: 'Format harga tidak sesuai, tidak ada provinsi'
                    }).status(500)
                }
                if (!x.price) {
                    return res.send({
                        success: false,
                        message: 'Format harga tidak sesuai, tidak ada harga'
                    }).status(500)
                }
                return {
                    provinceId: x.provinceId,
                    provinceName: province.name,
                    price: x.price
                }
            })
            return {
                name,
                desc,
                prices: maped
            }
        })

        const payload = {
            ...rest,
            accessory: mappedAccessory,
            img: file.path
        }

        // Were gonna handle the car and its option, and accessory first
        const car = await Car.create(payload);
        await CarGallery.bulkCreate(carGalleryPayload.map(x => {
            const {carId, ...rest} = x
            return {
                ...rest,
                carId: car.id
            }
        }))

        res.send({
            success: true,
            message: 'Mobil berhasil dibuat'
        })

        // console.log(JSON.parse(payload.accessory), JSON.parse(car.accessory))
    } catch (error) {
        console.log(error)
        // await transaction.rollback()
        res.send({
            success: false,
            message: error.message
        })
    }
})

router.patch('/change', authenticate, uploadGallery.fields([{name: 'img', maxCount: 1}, {name: 'colorImg'}, {name: 'oldImg'}]), async (req, res) => {
    try {
        const {body: data, user, files: {img: file, colorImg: files, oldImg: updateFiles}} = req
        const {id, newColors, colors, accessory, ...rest} = data

        // Catcher
        if (user.role !== '0') {
            return res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah data tersebut'
            }).status(401);
        }

        if(!id) {
            return res.send({
                success: false,
                message: 'ID mobil tidak ditemukan'
            })
        }

        // if (files.length === 0 && newColors) {
        //     return res.send({
        //         success: false,
        //         message: 'Foto warna mobil perlu ditambahkan'
        //     }).status(403);
        // }
        // parsing all the stringified data
        const parsedColors = JSON.parse(colors)
        const parsedNewColors = JSON.parse(newColors)
        const parsedAccessory = JSON.parse(accessory)

        // return res.send({
        //     success: false,
        //     message: 'In Debug Mode',
        // }).status(401)
        if (files.length !== 0 && !parsedNewColors) {
            return res.send({
                success: false,
                message: 'Nama Foto warna mobil perlu ditambahkan'
            }).status(403);
        }
        if (files.length !== parsedNewColors.length) {
            return res.send({
                success: false,
                message: 'Jumlah Foto warna mobil dan Harga warna mobil tidak sesuai'
            }).status(403);
        }

        if(!price) {
            return res.send({
                success: false,
                message: 'Harga per Region perlu ditambahkan'
            })
        }

        if(!isValid(price)) {
            return res.send({
                success: false,
                message: "Format Harga Region tidak sesuai"
            })
        }

        // find particular car data
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

        const provinces = parsedColors.reduce((acc, item) => {
            const {provinceId} = item
            // const provinceIds = prices.map(x => x.provinceId)
            acc.push(provinceId)
            return acc
        }, [])

        const provinceData = await Province.findAll({ where: { id: { [Op.in]: provinces } } })
        if(!provinceData) {
            return res.send({
                success: false,
                message: 'Salah Satu Provinsi tidak ditemukan'
            }).status(404)
        }
        const provinceMap = provinceData.reduce((acc, item) => {
            const key = item.id
            if (!acc[key]) acc[key] = item
            return acc
        }, {})
        
        const carGalleryIds = parsedColors.reduce((acc, item) => {
            const {id: galleryId} = item
            acc.push(galleryId)
            return acc
        }, [])
        const galleryData = await Gallery.findAll({where: { id: { [Op.in]: carGalleryIds }}})
        const galleryMapped = galleryData.reduce((acc, item) => {
            const key = item.id
            if (!acc[key]) acc[key] = item
            return acc
        }, {})
        const carGalleryData = await CarGallery.findAll({where: { galleryId: { [Op.in]: carGalleryIds }, carId: id}})
        const carGalleryMapped = carGalleryData.reduce((acc, item) => {
            const key = item.galleryId
            if (!acc[key]) acc[key] = item
            return acc
        }, {})

        // updating saved color data
        parsedColors.map(async pricing => {
            const {id: galleryId, name, category, price: prices, img: {exist, name: fileName}} = pricing
            const mapped = prices.map(x => {
                if (!x.provinceId) {
                    return res.send({
                        success: false,
                        message: 'Format harga tidak sesuai, tidak ada provinsi'
                    }).status(500)
                }
                if (!x.price) {
                    return res.send({
                        success: false,
                        message: 'Format harga tidak sesuai, tidak ada harga'
                    }).status(500)
                }
                const province = provinceMap[x.provinceId].name
                return {
                    ...x,
                    provinceName: province
                }
            })
            if (!galleryId || !galleryMapped[galleryId]) {
                return res.send({
                    success: false,
                    message: 'Gallery tidak ditemukan'
                })
            }
            if (!carGalleryMapped[galleryId]) {
                return res.send({
                    success: false,
                    message: 'Detail Gallery tidak ditemukan'
                })
            }
            const payload = {
                name
            }
            const carGallery = carGalleryMapped[galleryId]
            const newPath = updateFiles.find(x => x.originalName === fileName)
            if(exist && newPath) {
                const gallery = galleryMapped[galleryId]
                const fullPath = path.join(path.resolve(__dirname, '../../'), gallery.path); // Construct the full file path
                fs.access(fullPath)
                    .then(() => {
                        return fs.unlink(fullPath);
                    })
                    .then(() => {
                        console.log(`File unlinked successfully at path: ${fullPath}`);
                    })
                    .catch((err) => {
                        console.error(`Error while trying to unlink the file at path: ${fullPath}`, err);
                    });
                payload.path = newPath.path
            }
            await Gallery.update(payload, {
                where: {
                    id: galleryId
                }
            })
            await CarGallery.update({type: category, price: mapped}, {where: {
                id: carGallery.id
            }})
        })
        
        // creating new color
        const carGalleryPayload = []
        const mappedColor = parsedNewColors.map( async pricing => {
            const {name, category, prices, img: {exist, fileName}} = pricing
            const mapped = prices.map(x => {
                if (!x.provinceId) {
                    return res.send({
                        success: false,
                        message: 'Format harga tidak sesuai, tidak ada provinsi'
                    }).status(500)
                }
                if (!x.price) {
                    return res.send({
                        success: false,
                        message: 'Format harga tidak sesuai, tidak ada harga'
                    }).status(500)
                }
                const province = provinceMap[x.provinceId].name
                return {
                    ...x,
                    provinceName: province
                }
            })
            const path = files.find(x => x.originalName === fileName)
            if (exist && path) {
                const gallery = await Gallery.create({name, path: path.path});
                carGalleryPayload.push({carId: null, galleryId: gallery.id, type: category, price: prices})
            }
            return {
                name,
                prices: mapped,
                category
            }
        })
        const mappedAccessory = parsedAccessory.map(accessory => {
            const {name, desc, prices} = accessory
            const maped = prices.map(x => {
                const province = provinceMap[x.provinceId]
                if (!x.provinceId) {
                    return res.send({
                        success: false,
                        message: 'Format harga tidak sesuai, tidak ada provinsi'
                    }).status(500)
                }
                if (!x.price) {
                    return res.send({
                        success: false,
                        message: 'Format harga tidak sesuai, tidak ada harga'
                    }).status(500)
                }
                return {
                    provinceId: x.provinceId,
                    provinceName: province.name,
                    price: x.price
                }
            })
            return {
                name,
                desc,
                prices: maped
            }
        })

        const payload = {
            ...rest,
            price: mappedPrice,
            accessory: mappedAccessory
        }
        
        if (file && file[0]) {
            const fullPath = path.join(path.resolve(__dirname, '../../'), carData.img); // Construct the full file path
            fs.access(fullPath)
                .then(() => {
                    return fs.unlink(fullPath);
                })
                .then(() => {
                    console.log(`File unlinked successfully at path: ${fullPath}`);
                })
                .catch((err) => {
                    console.error(`Error while trying to unlink the file at path: ${fullPath}`, err);
                });
            payload.img = file[0].path
        }
        

        await Car.update({...payload}, {where: id});
        await CarGallery.bulkCreate(carGalleryPayload.map(x => {
            const {carId, ...rest} = x
            return {
                ...rest,
                carId: id
            }
        }))

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
    const {body: {deleteColors, id}, user} = req
    try {
        if (user.role !== '0') {
            return res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah data tersebut'
            }).status(401);
        }

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
            
            const gallery = car.Galleries.find(y => y.id === x)
            const fullPath = path.join(path.resolve(__dirname, '../../'), gallery.path); // Construct the full file path
            fs.access(fullPath)
                .then(() => {
                    return fs.unlink(fullPath);
                })
                .then(() => {
                    console.log(`File unlinked successfully at path: ${fullPath}`);
                })
                .catch((err) => {
                    console.error(`Error while trying to unlink the file at path: ${fullPath}`, err);
                });
            await Gallery.destroy({
                where: {
                    id: gallery.id
                }
            })
            await CarGallery.destroy({
                where: {
                    carId: car.id,
                    galleryId: x
                }
            })
        })

        const updated = await Car.findOne({
            where: {
                id
            },
            include: [
                {
                    model: Gallery,
                    attributes: ['id', 'name', 'path'],
                    through: {
                      model: CarGallery,
                      attributes: ['type', 'price']
                    },
                },
            ]
        })

        return res.status(200).send({
            success: true,
            message: `Gallery Mobil ${deleteColors.toString()} berhasil didelete`,
            data: updated
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

        console.log(req)

        if(!id) {
            return res.send({
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
            return res.send({
                success: false,
                message: 'Mobil Tidak Ditemukan'
            })
            return
        }
        
        const fullPath = path.join(path.resolve(__dirname, '../../'), carData.img); // Construct the full file path
        fs.access(fullPath)
            .then(() => {
                return fs.unlink(fullPath);
            })
            .then(() => {
                console.log(`File unlinked successfully at path: ${fullPath}`);
            })
            .catch((err) => {
                console.error(`Error while trying to unlink the file at path: ${fullPath}`, err);
            });

        // console.log({carData})
        const gallery = carData.Galleries

        gallery.map( async (x) => {
            const galleryPath = path.join(path.resolve(__dirname, '../../'), x.path); // Construct the full file path
            fs.access(galleryPath)
                .then(() => {
                    return fs.unlink(galleryPath);
                })
                .then(() => {
                    console.log(`File unlinked successfully at path: ${galleryPath}`);
                })
                .catch((err) => {
                    console.error(`Error while trying to unlink the file at path: ${galleryPath}`, err);
                });

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