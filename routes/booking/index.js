const {Router} = require('express')
const router = Router();
const sendMail = require('../../middleware/mailer')

const {Car, CarGallery, Gallery, Dealer, Province, City} = require('../../models');
const { Op } = require('sequelize');
const path = require('path');
const ejs = require('ejs');
const htmlPdf = require('html-pdf');


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
        let attachment
        let subject
        // const bcc = 'noreply@citroen.indomobil.co.id, care@citroen.indomobil.co.id, ferdinan.hendra@citroen.indomobil.co.id, galih.pamungkas@citroen.indomobil.co.id, heri.kurniawan@citroen.indomobil.co.id, ulung.windi@citroen.indomobil.co.id'
        const bcc = 'fauzanamrian12@gmail.com, daffa.firdaus13@gmail.com'
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
                subject = 'E - Quotation Citroen'
                const carGallery = car.Galleries.find(x => x.id === color)
                const carGalleryPrice = JSON.parse(carGallery.CarGallery.price).find(x => x.provinceId === provinceId)
                const carAccessory = JSON.parse(car.accessory)
                const selectedAccessory = carAccessory.find(x => x.name === accessory.name)
                const accessoryPrice = selectedAccessory.prices.find(x => x.provinceId === provinceId)
                const pdfPayload = {
                    status: 'Menunggu Konfirmasi',
                    quotationDate: new Date().toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'long', // You can use '2-digit' for numeric month or 'long' for full month name
                        year: 'numeric'
                    }),
                    requester: {
                        name,
                        phone: phoneNumber,
                        email,
                        address,
                        province: province.name,
                        city: city.name,
                    },
                    orderQuantity: 1,
                    vehicle: {
                        name: car.name,
                        color: carGallery.name,
                        price: carGalleryPrice.price,
                        option: selectedAccessory.name,
                        optionDesc: selectedAccessory.desc,
                        optionPrice: accessoryPrice.price,
                        total: carGalleryPrice.price + accessoryPrice.price,
                        image: `https://api.citroen-info.id/${car.img.split('public/')[1]}`
                    }
                }
                text = 
                `Hallo, ${name}. \n\n We're excited to have you get started with Citroën! \n Pada email ini kami lampirkan e-Quotation untuk mobil Citroën Anda. Silahkan tunjukkan kode QR atau Nomor Seri di bawah ini kepada salah satu staf Citroën di sekitar Anda atau Anda dapat mendatangi Dealer resmi Citroën untuk melanjutkan proses pemesanan Anda! \n\n Jika Anda memiliki pertanyaan, biarkan kami membantu Anda! \n Hubungi kami melalui WhatsApp(${dealer.pic})`
            
                console.log(pdfPayload.vehicle.image)
                // Render the EJS template to HTML for the PDF
                const html = await ejs.renderFile(path.resolve(__dirname, '../../', 'assets/templates/quotation.ejs'), pdfPayload);

                // Generate the PDF from HTML using html-pdf 
                const options = {
                    format: 'A3', // Sets the PDF to A4 size, which is closest to 800px width.
                    orientation: 'portrait', // Portrait orientation for the layout.
                    border: {
                        top: '20px',
                        right: '20px',
                        bottom: '20px',
                        left: '20px'
                    },
                    // width: '800px', // Forces content width to match CSS layout width.
                    // height: 'auto'  // Allows the height to adapt based on content.
                };
                htmlPdf.create(html, options).toBuffer(async (err, pdfBuffer) => {
                    if (err) {
                        return res.status(500).send('Error generating PDF: ' + err.toString());
                    }

                    attachment = {
                        filename: 'Test.pdf',
                        content: pdfBuffer
                    }

                    await sendMail({to: email, bcc, subject, text, attachment})
                })
                
                break;
            case 'Test Drive':
                subject = 'Citroen Booking'
                text = 
                `Hallo, ${name}. \n\n We're excited to have you get started with Citroën! \n Anda telah mengirimkan permintaan untuk test drive mobil Citroën. Kami akan segera menghubungi Anda. \n\n Berikut informasi data anda yang telah kami terima: \n Nama \t: ${name}\n Email \t: ${email}\n Alamat Domisili \t: ${address}\n Telepon \t: ${phoneNumber}\n Model \t: ${car.name.replace('|', '')}\n Permintaan \t: ${type}`
                await sendMail({to: email, bcc, subject, text})
                break;
        }
    
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