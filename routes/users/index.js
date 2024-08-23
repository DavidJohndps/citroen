const {Router} = require('express')
const router = Router();

const bcrypt = require('bcryptjs')
const {authenticate, upload} = require('../../middleware')

const User = require('../../models/user')

router.get('/', async (req, res) => {
    try {
        
        const {params} = req
    
        const data = await User.findAll({...params});
    
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
        if (role > user.role) {
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
        console.log({error})
        res.send({
            success: false,
            message: error.message
        })
    }
})

router.patch('/edit', authenticate, upload.single('profile_picture', async (req, res) => {
    try {
        const {body: data, user, file} = req
        const {role, id, password, ...rest} = data

        // role 0: admin, role 1:head, role 2:staff
        if (role > user.role) {
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

        const userData = await User.findOne({
            where: {
                id
            }
        })

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.update({...rest, password: hashedPassword ,profile_picture: file.path}, {where: { id }})

        const fullPath = path.join(__dirname, 'public/uploads', userData.profile_picture); // Construct the full file path

        fs.unlink(fullPath, (err) => {
            if (err) {
            return res.status(500).json({ error: 'Error deleting file', details: err });
            }

            // res.json({ message: 'File deleted successfully' });
        });

        res.send({
            success: true,
            message: 'Akun berhasil dibuat'
        })
    } catch (error) {
        console.log({error})
        res.send({
            success: false,
            message: error.message
        })
    }
}))

router.delete('/delete', authenticate, async (req, res) => {
    try {
        const {body: data, user} = req
        const { id } = data

        const userData = await User.findOne({
            where: {
                id
            }
        })

        if (user.role < userData.role) {
            res.send({
                success: false,
                message: 'Anda tidak memiliki akses untuk membuat akun tersebut'
            }).status(401);
            return
        }

        const fullPath = path.join(__dirname, 'public/uploads', userData.profile_picture); // Construct the full file path

        fs.unlink(fullPath, (err) => {
            if (err) {
            return res.status(500).json({ error: 'Error deleting file', details: err });
            }

            // res.json({ message: 'File deleted successfully' });
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