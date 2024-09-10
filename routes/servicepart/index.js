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
        
        const {query} = req
    
        const data = await Car.findAll({
            where: {...query},
            include: [
                {
                    model: Service,
                    attributes: {
                        exclude: ['createdAt', 'updatedAt']
                    },
                    through: {
                        as: 'List Breakdown',
                        model: CarService,
                        attributes: ['id','part', 'price']
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

router.post('/add', authenticate, async (req, res) => {
    try {
        const {body: data, user} = req
        const {carId, serviceId, part, ...rest} = data

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
            return res.send({
                success: false,
                message: 'Format Part tidak sesuai'
            })
        }

        await CarService.create({carId: car.id, serviceId: service.id, part: JSON.parse(part), ...rest})
        

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

router.post('/change', authenticate, async (req, res) => {
    try {
        const {body: data, user} = req
        const {id, carId, serviceId, part, ...rest} = data

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

        await CarService.update({carId, serviceId, part: JSON.parse(part), ...rest}, {where: {id}})

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