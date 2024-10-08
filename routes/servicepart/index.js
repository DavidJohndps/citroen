const {Router} = require('express')
const router = Router();
const path = require('path')
const fs = require('fs').promises;

const {authenticate} = require('../../middleware')

const {Service, Car, CarService} = require('../../models');
const { Op } = require('sequelize');

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
        
        const {query: {limit, offset, id,...rest}} = req
    

        const payload = {
            limit: parseInt(limit) || 10,
            offset: parseInt(offset) || 0,
        }
        if (id) payload.where = {id}
        const data = await Car.findAll({
            ...rest,
            ...payload,
            include: [
                {
                    model: Service,
                    as: 'Services',
                    attributes: {
                        exclude: ['createdAt', 'updatedAt']
                    },
                    through: {
                        as: 'List Breakdown',
                        model: CarService,
                        attributes: ['id','part', 'price']
                    },
                    order: [['period', 'ASC']],
                },
            ],
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
router.get('/admin', async (req, res) => {
    try {
        
        const {query: {limit, offset, id,...rest}} = req
    

        const payload = {
            offset: parseInt(offset) || 0,
        }
        if(parseInt(limit) && !isNaN(limit)) {
            payload.limit = parseInt(limit) || 10
        }
        const include = [
            {
                model: Car,
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                }
            },
            {
                model: Service,
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                }
            }
        ]
        if (id) include[0].where = {
            id: id
        }
        const data = await CarService.findAll({
            ...payload,
            ...rest,
            include
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
        const {carId, serviceId, part} = data

        const allowedRole = [0,1,2]
        if (allowedRole.includes(user.role)) {
            return res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah data tersebut'
            }).status(401);
        }

        const car = await Car.findOne({
            where: {
                id: carId
            }
        })

        if(!car) {
            return res.send({
                success: false,
                message: 'Mobil tidak ditemukan'
            }).status(404)
        }

        const service = await Service.findOne({
            where: {
                id: serviceId
            }
        })

        if(!service) {
            return res.send({
                success: false,
                message: 'Service Interval tidak ditemukan'
            }).status(404)
        }

        if(!isValid(part)) {
            console.log({part})
            return res.send({
                success: false,
                message: 'Format Part tidak sesuai'
            })
        }

        const parsedPart = JSON.parse(part);

        const {totalPrice} = parsedPart.reduce((acc, item) => {
            const {qty, price} = item
            if (!acc) {
                acc.totalPrice = 0
            }

            acc.totalPrice += parseInt(price) * parseInt(qty)
            return acc
        }, {totalPrice: 0})

        await CarService.create({carId: car.id, serviceId: service.id, part: JSON.parse(part), price: totalPrice * 1.11})
        

        res.send({
            success: true,
            message: 'Service Part berhasil dibuat'
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
        const {id, carId, serviceId, part} = data

        const allowedRole = [0,1,2]
        if (allowedRole.includes(user.role)) {
            return res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah data tersebut'
            }).status(401);
        }

        const servicePartData = await CarService.findOne({
            where: {
                id
            }
        })

        if(!servicePartData) {
            return res.send({
                success: false,
                message: 'Service Part tidak ditemukan'
            }).status(404)
        }

        const car = await Car.findOne({
            where: {
                id: carId
            }
        })

        if(!car) {
            return res.send({
                success: false,
                message: 'Mobil tidak ditemukan'
            }).status(404)
        }

        const service = await Service.findOne({
            where: {
                id: serviceId
            }
        })

        if(!service) {
            return res.send({
                success: false,
                message: 'Service Interval tidak ditemukan'
            }).status(404)
        }

        if(!isValid(part)) {
            return res.send({
                success: false,
                message: 'Format Part tidak sesuai'
            })
        }

        const parsedPart = JSON.parse(part);

        const {totalPrice} = parsedPart.reduce((acc, item) => {
            const {qty, price} = item
            if (!acc) {
                acc.totalPrice = 0
            }

            acc.totalPrice += parseInt(price) * parseInt(qty)
            return acc
        }, {totalPrice: 0})

        await CarService.update({carId, serviceId, part: parsedPart, price: totalPrice * 1.11}, {where: {id}})

        res.send({
            success: true,
            message: 'Service Part berhasil dirubah'
        })
    } catch (error) {
        console.log({error})
        res.send({
            success: false,
            message: error.message
        })
    }
})

router.delete('/remove', authenticate, async(req, res) => {
    const {body: {id}} = req
    try {
        if(!id) {
            return res.send({
                success: false,
                message: 'ID Service Part tidak ditemukan'
            })
        }

        await CarService.destroy({
            where: {
                id
            }
        })

        return res.status(200).send({
            success: true,
            message: `Service Part berhasil didelete`
        })
    } catch (error) {
        console.log(error)
        return res.send({
            success: false,
            message: error.message
        })
    }
})

module.exports = router;