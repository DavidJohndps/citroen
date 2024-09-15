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
                  attributes: ['name'],
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
        const {colors, accessory, price, ...rest} = data

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

        // console.log({file, files, rest, colors})

        // return res.send({
        //     success: true,
        //     message: 'In Debug Mode'
        // })

        // parsing all the stringified data
        const parsedColors = JSON.parse(colors)
        const parsedAccessory = JSON.parse(accessory)
        const parsedPrice = JSON.parse(price)

        const provinces = parsedPrice.reduce((acc, item) => {
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

        // verify all parsed json have valid property
        const mappedPrice = parsedPrice.map(pricing => {
            const {provinceId, price} = pricing
            if (!provinceId) {
                return res.send({
                    success: false,
                    message: 'Format harga tidak sesuai, tidak ada provinsi'
                }).status(500)
            }
            if (!price) {
                return res.send({
                    success: false,
                    message: 'Format harga tidak sesuai, tidak ada harga'
                }).status(500)
            }
            const province = provinceMap[provinceId].name
            return {
                provinceId,
                name: province,
                price
            }
        })
        // parsedColors.map(async (pricing, index) => {
        //     const {provinceId, name, category, price} = pricing
        //     if (!provinceId) {
        //         return res.send({
        //             success: false,
        //             message: 'Format harga tidak sesuai, tidak ada provinsi'
        //         }).status(500)
        //     }
        //     if (!price) {
        //         return res.send({
        //             success: false,
        //             message: 'Format harga tidak sesuai, tidak ada harga'
        //         }).status(500)
        //     }
        //     const province = provinceMap[provinceId].name
        //     const path = files[index].path
        //     const gallery = await Gallery.create({name, path}, {transaction});
        //     await CarGallery.create({carId: car.id, galleryId: gallery.id, type: category}, {transaction})
        //     return {
        //         provinceId,
        //         name,
        //         provinceName: province.name,
        //         price
        //     }
        // })
        
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
                const province = provinceMap[x.provinceId].name
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
            price: mappedPrice,
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

        // // check if color option exist first
        // const colorData = await ColorOption.findAll({
        //     where: {
        //         id: {
        //             [Op.in]: parsedColors.map(x => x.id)
        //         },
        //     }
        // })
        // if(colorData.length !== parsedColors.length) {
        //     return res.send({
        //         success: false,
        //         message: 'Salah satu warna tidak ditemukan'
        //     })
        // }

        // // create color compatibility
        // const carColorOptionPayload = parsedColors.map(x => ({colorOptionId: x.id,carId: car.id}))
        // const carColorOptions = await CarColourOption.bulkCreate(carColorOptionPayload, {transaction})
        // const carColorMap = carColorOptions.reduce((acc, item) => {
        //     const key = item.colorOptionId
        //     if (!acc[key]) acc[key] = item
        //     return acc
        // }, {})

        // // check if accessory package exist
        // const accessoryData = await Accessory.findAll({
        //     where: {
        //         id: {
        //             [Op.in]: parsedAccessory.map(x => x.id)
        //         }
        //     }
        // })
        // if(accessoryData.length !== parsedAccessory.length) {
        //     return res.send({
        //         success: false,
        //         message: 'Salah satu accessory tidak ditemukan'
        //     })
        // }

        // // for color also save the gallery for particular image
        // accessoryData.map(async (el, index) => {
        //     const {name, category} = el
        //     const path = files[index].path
        //     const gallery = await Gallery.create({name, path}, {transaction});
        //     await CarGallery.create({carId: car.id, galleryId: gallery.id, type: category}, {transaction})
        // })

        // // create accessory compatibility
        // const carAccessoryPayload = parsedAccessory.map(x => ({accessoryId: x.id, carId: car.id}))
        // const carAccessoryData = await CarAccessory.bulkCreate(carAccessoryPayload, {transaction})
        // const carAccessoryMap = carAccessoryData.reduce((acc, item) => {
        //     const key = item.accessoryId
        //     if (!acc[key]) acc[key] = item
        //     return acc
        // }, {})

        // // then we'll handle the prices for each region (car, accessory, colors)
        // // first car prices
        // const carRegionPayload = parsedRegion.map(x => ({regionId: x.id, carId: car.id, price: x.price}));
        // await CarPrice.create(carRegionPayload, {transaction})

        // // second option prices
        // const colorOptionPricePayload = parsedColors.map(x => {
        //     const carColorOptions = carColorMap[x.id]
        //     return {
        //         carColorOptionId: carColorOptions.id,
        //         regionId: x.regionId,
        //         price: x.price
        //     }
        // })
        // await ColourOptionPrice.bulkCreate(colorOptionPricePayload, {transaction})

        // // last accessory prices
        // const accessoryPricePayload = carAccessoryPayload.map(x => {
        //     const carAccessory = carAccessoryMap[x.id]
        //     return {
        //         carAccessoryId: carAccessory.id,
        //         regionId: x.regionId,
        //         price: x.price
        //     }
        // })
        // await AccessoryPrice.bulkCreate(accessoryPricePayload, {transaction})

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

router.patch('/change', authenticate, uploadGallery.fields([{name: 'img', maxCount: 1}, {name: 'colorImg'}]), async (req, res) => {
    try {
        const {body: data, user, files: {img: [file], colorImg: files}} = req
        const { id, colors, accessory, regionPrices, ...rest} = data

        // Catcher
        if (user.role !== '0') {
            return res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah data tersebut'
            }).status(401);
        }

        if(!id) {
            res.send({
                success: false,
                message: 'ID mobil tidak ditemukan'
            })
        }

        // if (files.length === 0 && colors) {
        //     res.send({
        //         success: false,
        //         message: 'Foto warna mobil perlu ditambahkan'
        //     }).status(403);
        // }

        if (files.length !== 0 && !colors) {
            res.send({
                success: false,
                message: 'Nama Foto warna mobil perlu ditambahkan'
            }).status(403);
        }

        if(!regionPrices) {
            return res.send({
                success: false,
                message: 'Harga per Region perlu ditambahkan'
            })
        }

        if(!isValid(regionPrices)) {
            return res.send({
                success: false,
                message: "Format Harga Region tidak sesuai"
            })
        }

        if (regionPrices) {
            const regionData = await Region.findAll({ where: { id: { [Op.in]: regionPrices.map(x => x.regionId) } } })
            if(!regionData) {
                return res.send({
                    success: false,
                    message: 'Salah Satu Region tidak ditemukan'
                }).status(404)
            }
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

        // payload for car data
        const payload = {...rest, accessory: JSON.parse(accessory)}

        // if theres file unliked the past file
        if(file) {
            payload.img = file.path

            const fullPath = path.join(path.resolve(__dirname, '../../'), carData.img); // Construct the full file path
            await fs.unlink(fullPath);
        }

        // update the car data
        await Car.update(payload, {where: { id }})

        const parsedRegion = JSON.parse(regionPrices)

        // delete past car prices
        await CarRegion.destroy({
            where: {
                carId: id
            }
        })

        // create car prices to each region
        parsedRegion.map( async region => {
            await CarRegion.create({carId: id, regionId: region.regionId, price: region.price})
        })

        if (files.length !== 0) {
            const parsed = JSON.parse(colors)
    
            parsed.map(async (el, index) => {
                const {name, category} = el
                const path = files[index].path
                const gallery = await Gallery.create({name, path})
                await CarGallery.create({carId: id, galleryId: gallery.id, type: category})
            })
        }

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