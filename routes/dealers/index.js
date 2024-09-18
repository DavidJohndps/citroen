const {Router} = require('express')
const router = Router();
const path = require('path')
const fs = require('fs').promises;

const {authenticate, uploadGallery} = require('../../middleware')

const {User, Dealer, Facility, DealerFacility, Province, City, Gallery, DealerGallery} = require('../../models');
const { Op } = require('sequelize');

router.get('/', async (req, res) => {
    try {
        
        const {query: {limit, offset, ...rest}} = req
    
        const data = await Dealer.findAll({
            limit: parseInt(limit) || 10,
            offset: parseInt(offset) || 0,
            ...rest,
            include: [
                {
                    model: Facility,
                    attributes: ['id','name'],
                    through: {
                        model: DealerFacility,
                        attributes:[]
                    }
                },
                {
                    model: Gallery,
                    through: {
                        model: DealerGallery,
                        attributes:['id']
                    }
                },
                {
                    model: User,
                    as: 'Customer Service',
                    attributes: {
                        exclude: ['id', 'password', 'role']
                    }
                },
                {
                    model: User,
                    as: 'Dealer Head',
                    attributes: {
                        exclude: ['id', 'password', 'role']
                    }
                },
                {
                    model: Province,
                    as: 'Province',
                    attributes: {
                        exclude: ['id']
                    }
                },
                {
                    model: City,
                    as: 'City',
                    attributes: {
                        exclude: ['id', 'provinceId']
                    }
                },
            ]
        })
    
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

router.post('/add', authenticate, uploadGallery.fields([{name: 'img', maxCount: 1}, {name: 'galleries'}]),async (req, res) => {
    try {
        const {body: data, user, files: {img: [file], galleries: files}} = req
        const {pic, head, service, sales, facility, provinceId, workingHours, cityId, ...rest} = data

        const facilities = JSON.parse(facility)
        const workingHour = JSON.parse(workingHours)
        if (user.role !== '0') {
            return res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah data tersebut'
            }).status(401);
        }

        const picUser = await User.findOne({
            where: {
                id: pic
            }
        })

        if(!picUser) {
            return res.send({
                success: false,
                message: 'Akun PIC Tidak Ditemukan'
            })
        }

        if (head) {
            const headUser = await User.findOne({
                where: {
                    id: head
                }
            })
    
            if(!headUser) {
                return res.send({
                    success: false,
                    message: 'Akun Head Tidak Ditemukan'
                })
            }
        }
        if (sales) {
            const salesUser = await User.findOne({
                where: {
                    id: sales
                }
            })
    
            if(!salesUser) {
                return res.send({
                    success: false,
                    message: 'Akun Sales Tidak Ditemukan'
                })
            }
        }
        if (service) {
            const serviceUser = await User.findOne({
                where: {
                    id: service
                }
            })
    
            if(!serviceUser) {
                return res.send({
                    success: false,
                    message: 'Akun Service Tidak Ditemukan'
                })
            }
        }

        const facilityData = await Facility.findAll({
            where: {
                id: {
                    [Op.in]: facilities
                }
            }
        })

        if(facilityData.length === 0) {
            return res.send({
                success: false,
                message: 'Fasilitas tidak ditemukan'
            })
        }

        const provinceData = await Province.findOne({
            where: {
                id: provinceId
            }
        })

        if(!provinceData) {
            return res.send({
                success:false,
                message: 'Provinsi tidak ditemukan'
            })
        }

        const cityData = await City.findOne({
            where: {
                id: cityId,
                provinceId
            }
        })

        if(!cityData) {
            return res.send({
                success:false,
                message: 'Provinsi/Kota tidak ditemukan'
            })
        }

        if (!file) {
            return res.send({
                success: false,
                message: 'Foto Dealer perlu ditambahkan'
            })
        }
        
        const dealer = await Dealer.create({...rest, pic, head, service, sales, provinceId, cityId, workingHours: workingHour, img: file.path});
        for (const facility of facilityData) {
            await DealerFacility.create({facilityId: facility.id, dealerId: dealer.id})
        }

        if (files.length !== 0) {
            // return res.send({
            //     success: false,
            //     message: 'Foto warna mobil perlu ditambahkan'
            // }).status(403);

            files.map( async gallery => {

                const path = gallery.path
                const galleryData = await Gallery.create({path});
                await DealerGallery.create({dealerId: dealer.id, galleryId: galleryData.id})
            })

        }
        // for (const car of cars) {
        //     await CarDealer.create({carId: car.id, dealerId: dealer.id, price: car.price})
        // }

        res.send({
            success: true,
            message: 'Dealer berhasil dibuat'
        })
    } catch (error) {
        console.log(error)
        res.send({
            success: false,
            message: error.message
        })
    }
})

router.patch('/change', authenticate, uploadGallery.fields([{name: 'img', maxCount: 1}, {name: 'galleries'}]), async (req, res) => {
    try {
        const {body: data, user, files: {img: [file], galleries: files}} = req
        const {id, pic, head, service, sales, facility, provinceId, workingHours, cityId, ...rest} = data

        const facilities = JSON.parse(facility)
        const workingHour = JSON.parse(workingHours)
        if (user.role !== '0') {
            return res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah data tersebut'
            }).status(401);
        }

        if(!id) {
            return res.send({
                success: false,
                message: 'Dealer tidak ditemukan'
            })
        }

        const dealerData = await Dealer.findOne({
            where: {
                id
            },
            include: [
                {
                    model: Facility,
                    attributes: ['name'],
                    through: {
                        model: DealerFacility,
                        attributes:['id']
                    }
                },
                // {
                //     model: Car,
                //     as: 'Cars',
                //     attributes: {
                //         exclude: ['price']
                //     },
                //     through: {
                //         model: CarDealer,
                //         as: 'Dealer Price',
                //         attributes:['id', 'price']
                //     }
                // },
            ]
        })

        const picUser = await User.findOne({
            where: {
                id: pic
            }
        })

        if(!picUser) {
            return res.send({
                success: false,
                message: 'Akun PIC Tidak Ditemukan'
            })
        }

        if (head) {
            const headUser = await User.findOne({
                where: {
                    id: head
                }
            })
    
            if(!headUser) {
                return res.send({
                    success: false,
                    message: 'Akun Head Tidak Ditemukan'
                })
            }
        }
        if (sales) {
            const salesUser = await User.findOne({
                where: {
                    id: sales
                }
            })
    
            if(!salesUser) {
                return res.send({
                    success: false,
                    message: 'Akun Sales Tidak Ditemukan'
                })
            }
        }
        if (service) {
            const serviceUser = await User.findOne({
                where: {
                    id: service
                }
            })
    
            if(!serviceUser) {
                return res.send({
                    success: false,
                    message: 'Akun Service Tidak Ditemukan'
                })
            }
        }

        const facilityData = await Facility.findAll({
            where: {
                id: {
                    [Op.in]: facilities
                }
            }
        })

        if(facilityData.length === 0) {
            return res.send({
                success: false,
                message: 'Fasilitas tidak ditemukan'
            })
        }

        const provinceData = await Province.findOne({
            where: {
                id: provinceId
            }
        })

        if(!provinceData) {
            return res.send({
                success:false,
                message: 'Provinsi tidak ditemukan'
            })
        }

        const cityData = await City.findOne({
            where: {
                id: cityId,
                provinceId
            }
        })

        if(!cityData) {
            return res.send({
                success:false,
                message: 'Provinsi/Kota tidak ditemukan'
            })
        }

        if (!file) {
            return res.send({
                success: false,
                message: 'Foto Dealer perlu ditambahkan'
            })
        }

        const payload = {
            ...rest, pic, head, sales, service, provinceId, cityId, workingHours: workingHour
        }

        if (file) {
            payload.img = file.path
            const fullPath = path.join(path.resolve(__dirname, '../../'), dealerData.img); // Construct the full file path

            await fs.unlink(fullPath);
        }

        await Dealer.update(payload, {where: {id}});

        for (const dealerFacility of dealerData.Facilities) {
            const {DealerFacility: {id}} = dealerFacility
            await DealerFacility.destroy({where: {id}})
        }
        for (const facility of facilityData) {
            await DealerFacility.create({facilityId: facility.id, dealerId: id})
        }

        if (files && files?.length !== 0) {
            console.log(files)
            // return res.send({
            //     success: false,
            //     message: 'Foto warna mobil perlu ditambahkan'
            // }).status(403);

            files.map( async gallery => {

                const path = gallery.path
                const galleryData = await Gallery.create({path});
                await DealerGallery.create({dealerId: id, galleryId: galleryData.id})
            })

        }

        // for (const dealerCar of dealerData.Cars) {
        //     const {id} = dealerCar['Dealer Price']
        //     await CarDealer.destroy({where: {id}})
        // }

        // for (const car of cars) {
        //     await CarDealer.create({carId: car.id, dealerId: id, price: car.price})
        // }

        res.send({
            success: true,
            message: 'Dealer berhasil dirubah'
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
    const {body: {galleryId, id}} = req
    try {
        if(!id) {
            return res.send({
                success: false,
                message: 'Dealer tidak ditemukan'
            })
        }
        if(!galleryId) {
            return res.send({
                success: false,
                message: 'Gallery dealer tersebut tidak ditemukan'
            })
        }

        const dealer = await Dealer.findOne({
            where: {
                id
            }
        })
        if(!dealer) {
            return res.send({
                success: false,
                message: 'Dealer tersebut tidak ditemukan'
            })
        }
        
        const dealerGallery = await DealerGallery.findOne({
            where: {
                id: galleryId,
                dealerId: id,
            }
        })

        if (!dealerGallery) {
            return res.send({
                success: false,
                message: 'Gallery Dealer tidak ditemukan'
            }).status(404)
        }

        const gallery = await Gallery.findOne({
            where: {
                id: dealerGallery.galleryId
            }
        })
        
        const fullPath = path.join(path.resolve(__dirname, '../../'), gallery.path); // Construct the full file path

        await fs.unlink(fullPath);

        await DealerGallery.destroy({where: {galleryId}});

        return res.status(200).send({
            success: true,
            message: `Gallery Dealer berhasil didelete`
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
        const {body: data, user} = req
        const { id } = data

        const dealerData = await Dealer.findOne({
            where: {
                id
            },
            include: [
                {
                    model: Facility,
                    attributes: ['name'],
                    through: {
                        model: DealerFacility,
                        attributes:['id']
                    }
                },
                {
                    model: Gallery,
                    through: {
                        model: DealerGallery,
                        attributes:['id']
                    }
                }
            ]
        })

        if (user.role !== '0') {
            return res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah data tersebut'
            }).status(401);
        }

        // for (const dealerFacility of dealerData.Facilities) {
        //     const {DealerFacility: {id}} = dealerFacility
        //     await DealerFacility.destroy({where: {id}})
        // }

        console.log(dealerData)

        if (dealerData.Galleries.length !== 0)
            for (const gallery of dealerData.Galleries) {
                const {DealerGallery: {id}} = gallery
                const fullPath = path.join(path.resolve(__dirname, '../../'), gallery.path); // Construct the full file path
                // console.log({path: gallery.path, fullPath})
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
                await DealerFacility.destroy({where: {id}})
            }


        // for (const dealerCar of dealerData.Cars) {
        //     const {id} = dealerCar['Dealer Price']
        //     await CarDealer.destroy({where: {id}})
        // }

        const fullPath = path.join(path.resolve(__dirname, '../../'), dealerData.img); // Construct the full file path

        await fs.unlink(fullPath);

        await Dealer.destroy({
            where:{
                id
            }
        })

        res.send({
            success: true,
            message: 'Dealer berhasil dihapus'
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