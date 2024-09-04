const {Router} = require('express')
const router = Router();

const {authenticate, upload} = require('../../middleware')

const {User, Dealer, Facility, DealerFacility, Province, City} = require('../../models');
const { Op } = require('sequelize');

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
                        exclude: ['username', 'password', 'role']
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
                        exclude: ['id']
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
        const {pic, head, facility, provinceId, cityId, ...rest} = data

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

        const facilityData = await Facility.findOne({
            where: {
                id: {
                    [Op.in]: facility
                }
            }
        })

        if(!facilityData) {
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
        
        const dealer = await Dealer.create({...rest, pic, head, provinceId, cityId});
        await DealerFacility.create({facilityId: facilityData.id, dealerId: dealer.id})

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

router.patch('/change', authenticate, upload.single('profile_picture'), async (req, res) => {
    try {
        const {body: data, user, file} = req
        const {role, id, password, ...rest} = data

        // role 0: admin, role 1:head, role 2:staff
        if (user.role !== '0') {
            return res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah data tersebut'
            }).status(401);
        }

        if(!file) {
            res.send({
                success: false,
                message: 'Foto profil perlu ditambahkan'
            }).status(403);
        }

        const userData = await User.findOne({
            where: {
                id
            }
        })

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.update({...rest, password: hashedPassword ,profile_picture: file.path, role}, {where: { id }})

        const fullPath = path.join(path.resolve(__dirname, '../../'), userData.profile_picture); // Construct the full file path

        await fs.access(fullPath);
        await fs.unlink(fullPath);

        res.send({
            success: true,
            message: 'Akun berhasil dirubah'
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

        const userData = await User.findOne({
            where: {
                id
            }
        })

        if (user.role !== '0') {
            return res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah data tersebut'
            }).status(401);
        }

        const fullPath = path.join(path.resolve(__dirname, '../../'), userData.profile_picture); // Construct the full file path

        await fs.unlink(fullPath);

        await User.destroy({
            where:{
                id
            }
        })

        res.send({
            success: true,
            message: 'Akun berhasil dihapus'
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