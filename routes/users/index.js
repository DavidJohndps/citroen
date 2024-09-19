const {Router} = require('express')
const router = Router();
const path = require('path')
const fs = require('fs').promises;

const bcrypt = require('bcryptjs')
const {authenticate, upload} = require('../../middleware')

const {User} = require('../../models')

router.get('/', async (req, res) => {
    try {
        const {query: {limit, offset, id, ...rest}} = req

        const payload = {
            limit: parseInt(limit) || 10,
            offset: parseInt(offset) || 0,
        }
        if (id) payload.where = {id}
        const data = await User.findAll({
            ...payload,
            ...rest,
            attributes: {
            exclude: ['password']
        }});
    
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

router.post('/add', authenticate, upload.single('profile_picture'), async (req, res) => {
    try {
        const {body: data, user, file} = req
        const {role, password} = data

        // role 0: admin, role 1:head, role 2:staff
        if (role <= user.role) {
            res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk membuat akun tersebut'
            }).status(401);
            return
        }

        if(!file) {
            res.send({
                success: false,
                message: 'Foto profil perlu ditambahkan'
            }).status(403);
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({...data, password: hashedPassword, profile_picture: file.path});

        res.send({
            success: true,
            message: 'Akun berhasil dibuat'
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
        if (role <= user.role) {
            res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah role akun tersebut'
            }).status(401);
            return
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
        const payload = {
            ...rest,
            role,
            password: hashedPassword,
        }
        if (file) payload.profile_picture = file.path
        const fullPath = path.join(path.resolve(__dirname, '../../'), userData.profile_picture); // Construct the full file path
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
        await User.update(payload, {where: { id }})


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

        if (userData.role <= user.role) {
            res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk merubah role akun tersebut'
            }).status(401);
            return
        }

        const fullPath = path.join(path.resolve(__dirname, '../../'), userData.profile_picture); // Construct the full file path

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