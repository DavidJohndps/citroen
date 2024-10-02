const {Router} = require('express')
const router = Router();
const sendMail = require('../../middleware/mailer')

const {Car, CarGallery, Gallery, Dealer, Province, City} = require('../../models');
const { Op } = require('sequelize');


router.post('/', async (req, res) => {
    try {
        
        const {body: data} = req
        const {type, carData: carId, selectedColor: color, selectedAccessory: accessory, KTPName: name, PhoneNumber: phoneNumber, email, provincies: provinceId, city: cityId, address} = data
        
        const car = await Car.findOne({
            where: {
                id: carId
            },
            include: [
                {
                    model: Gallery,
                    attributes: ['id', 'name', 'path'],
                    through: {
                        model: CarGallery,
                        attributes: ['id', 'type', 'price']
                    }
                }
            ]
        })
        let dealer
        let province
        let city
        if (type === 'Get Quotation') {
            dealer = await Dealer.findOne({
                where: {
                    [Op.or]: [
                        { provinceId },
                        { cityId: { [Op.eq]: cityId } }
                    ]
                }
            })
            province = await Province.findOne({
                where: {
                    id: provinceId
                }
            })
            city = await City.findOne({
                where: {
                    id: cityId,
                    provinceId
                }
            })
        }
        
        let text = ''
        switch (type) {
            case 'Get Quotation':
                const carGallery = car.Galleries.find(x => x.id === color)
                const carGalleryPrice = JSON.parse(carGallery.CarGallery.price).find(x => x.provinceId === provinceId)
                const carAccessory = JSON.parse(car.accessory)
                const selectedAccessory = carAccessory.find(x => x.name === accessory.name)
                const accessoryPrice = selectedAccessory.prices.find(x => x.provinceId === provinceId)
                const pdfPayload = {
                    code: '',
                    name,
                    phoneNumber,
                    email,
                    address,
                    province: province.name,
                    city: city.name,
                    vehicle: {
                        name: car.name,
                        color: carGallery.name,
                        price: carGalleryPrice.price,
                        option: selectedAccessory.name,
                        optionPrice: accessoryPrice.price,
                        total: carGalleryPrice.price + accessoryPrice.price
                    }
                }
                text = 
                `Hallo, ${name}. \n\n We're excited to have you get started with Citroën! \n Pada email ini kami lampirkan e-Quotation untuk mobil Citroën Anda. Silahkan tunjukkan kode QR atau Nomor Seri di bawah ini kepada salah satu staf Citroën di sekitar Anda atau Anda dapat mendatangi Dealer resmi Citroën untuk melanjutkan proses pemesanan Anda! \n\n Jika Anda memiliki pertanyaan, biarkan kami membantu Anda! \n Hubungi kami melalui WhatsApp(${dealer.pic})`
                break;
            case 'Test Drive':
                text = 
                `Hallo, ${name}. \n\n We're excited to have you get started with Citroën! \n Anda telah mengirimkan permintaan untuk test drive mobil Citroën. Kami akan segera menghubungi Anda. \n\n Berikut informasi data anda yang telah kami terima: \n Nama \t: ${name}\n Email \t: ${email}\n Alamat Domisili \t: ${address}\n Telepon \t: ${phoneNumber}\n Model \t: ${car.name.replace('|', '')}\n Permintaan \t: ${type}`
                break;
        }
        // await sendMail({to, subject, text})
    
        res.send({
            success: true,
            data
        }).status(200);
    } catch (error) {
        console.log(error)
        res.send({
            success: false,
            message: error.message
        }).status(error.code)
    }
});

module.exports = router;