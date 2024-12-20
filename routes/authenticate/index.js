const {Router} = require('express');
const router = Router();
const bcrypt = require('bcryptjs')

const {User} = require('../../models');
const { generateToken } = require('../../library/jwt');

router.post('/', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ where: { email } });
  
      if (!user) {
        return res.status(400).send({
            success: false,
            message: 'Akun Tidak Ditemukan'
        });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(400).send({
            success: false,
            message: 'Password anda salah'
        });
      }
      
      const token = generateToken(user);
  
      return res.status(200).send({ success: true, token });
    } catch (err) {
        console.log({err})
        return res.status(500).send({
            success: false,
            message: err.message
        });
    }
});

module.exports = router
  