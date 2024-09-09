const {Router} = require('express')
const router = Router();

const {authenticate, upload} = require('../../middleware')

const {User, Dealer, Facility, DealerFacility, Province, City, Car, CarDealer} = require('../../models');
const { Op, where } = require('sequelize');

router.get('/', async (req, res) => {
    try {
        
        const {query} = req
    
        const data = await Dealer.findAll({
            where: {...query},
            include: [
                {
                    model: Facility,
                    attributes: ['name'],
                    through: {
                        model: DealerFacility,
                        attributes:[]
                    }
                },
                {
                    model: Car,
                    as: 'Cars',
                    attributes: {
                        exclude: ['price']
                    },
                    through: {
                        model: CarDealer,
                        as: 'Dealer Price',
                        attributes:['price']
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

router.post('/add', authenticate, async (req, res) => {
    try {
        const {body: data, user} = req
        const {pic, head, facility, cars, provinceId, cityId, ...rest} = data

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

        const facilityData = await Facility.findAll({
            where: {
                id: {
                    [Op.in]: facility
                }
            }
        })

        if(facilityData.length === 0) {
            return res.send({
                success: false,
                message: 'Fasilitas tidak ditemukan'
            })
        }

        const carIds = cars.map(x => x.id)

        const carData = await Car.findAll({
            where: {
                id: {
                    [Op.in]: carIds
                }
            }
        })

        if(carData.length === 0) {
            return res.send({
                success: false,
                message: 'Mobil tidak ditemukan'
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
        
        const dealer = await Dealer.create({...rest, pic, head, provinceId, cityId});
        for (const facility of facilityData) {
            await DealerFacility.create({facilityId: facility.id, dealerId: dealer.id})
        }
        for (const car of cars) {
            await CarDealer.create({carId: car.id, dealerId: dealer.id, price: car.price})
        }

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

router.patch('/change', authenticate, async (req, res) => {
    try {
        const {body: data, user} = req
        const {id, pic, head, facility, cars, provinceId, cityId, ...rest} = data

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
                {
                    model: Car,
                    as: 'Cars',
                    attributes: {
                        exclude: ['price']
                    },
                    through: {
                        model: CarDealer,
                        as: 'Dealer Price',
                        attributes:['id', 'price']
                    }
                },
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

        const facilityData = await Facility.findAll({
            where: {
                id: {
                    [Op.in]: facility
                }
            }
        })

        if(facilityData.length === 0) {
            return res.send({
                success: false,
                message: 'Fasilitas tidak ditemukan'
            })
        }

        const carIds = cars.map(x => x.id)

        const carData = await Car.findAll({
            where: {
                id: {
                    [Op.in]: carIds
                }
            }
        })

        if(carData.length === 0) {
            return res.send({
                success: false,
                message: 'Mobil tidak ditemukan'
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

        await Dealer.update({...rest, pic, head, provinceId, cityId}, {where: {id}});

        for (const dealerFacility of dealerData.Facilities) {
            const {DealerFacility: {id}} = dealerFacility
            await DealerFacility.destroy({where: {id}})
        }
        for (const facility of facilityData) {
            await DealerFacility.create({facilityId: facility.id, dealerId: id})
        }

        for (const dealerCar of dealerData.Cars) {
            const {id} = dealerCar['Dealer Price']
            await CarDealer.destroy({where: {id}})
        }

        for (const car of cars) {
            await CarDealer.create({carId: car.id, dealerId: id, price: car.price})
        }

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
                    model: Car,
                    as: 'Cars',
                    attributes: {
                        exclude: ['price']
                    },
                    through: {
                        model: CarDealer,
                        as: 'Dealer Price',
                        attributes:['id', 'price']
                    }
                },
            ]
        })

        if (user.role !== '0') {
            return res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah data tersebut'
            }).status(401);
        }

        for (const dealerFacility of dealerData.Facilities) {
            const {DealerFacility: {id}} = dealerFacility
            await DealerFacility.destroy({where: {id}})
        }

        for (const dealerCar of dealerData.Cars) {
            const {id} = dealerCar['Dealer Price']
            await CarDealer.destroy({where: {id}})
        }

        // const fullPath = path.join(path.resolve(__dirname, '../../'), userData.profile_picture); // Construct the full file path

        // await fs.unlink(fullPath);

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