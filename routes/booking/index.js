const { Router } = require('express');
const router = Router();
const sendMail = require('../../middleware/mailer');
const { uploadGallery, uploadToDrive } = require('../../middleware')
const { Car, CarGallery, Gallery, Dealer, Province, City } = require('../../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;
const ejs = require('ejs');
const puppeteer = require('puppeteer');  // Use standard puppeteer package
const {google} = require('googleapis');  // Use standard puppeteer package
const auth = require('../../middleware/googleAuth')
const moment = require('moment');

moment.locale('id');

router.post('/', uploadGallery.fields([{name: 'ktp', maxCount: 1}, {name: 'sim', maxCount: 1}]), async (req, res) => {
    try {
        const { body: data } = req;
        const { type, carData: carId, selectedColor: color, selectedAccessory: accessory, KTPName: name, noKtp, PhoneNumber: phoneNumber, email, provincies: provinceId, city: cityId, fullAddress: address, area: closestDealer, dealer: selectedDealer } = data;

        const spreadsheetId = process.env.SHEET_ID

        const car = await Car.findOne({
            where: { id: carId },
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
        });

        let dealer, province, city, attachment, subject, ktpFile, simFile;
        const bcc = 'noreply@citroen.indomobil.co.id, care@citroen.indomobil.co.id, ferdinan.hendra@citroen.indomobil.co.id, galih.pamungkas@citroen.indomobil.co.id, heri.kurniawan@citroen.indomobil.co.id, ulung.windi@citroen.indomobil.co.id';

        if (type === 'Get Quotation') {
            dealer = await Dealer.findOne({
                where: {
                    [Op.or]: [
                        { provinceId },
                        { cityId: { [Op.eq]: cityId } }
                    ]
                }
            });
            province = await Province.findOne({ where: { id: provinceId } });
            city = await City.findOne({ where: { id: cityId, provinceId } });
        }
        if(type === 'Test Drive') {
            province = await Province.findOne({ where: { id: provinceId } });
            city = await City.findOne({ where: { id: cityId, provinceId } });
        }
        if (type === 'Test Drive 6 days') {
            ktpFile = req.files.ktp
            simFile = req.files.sim
            if(!Array.isArray(ktpFile) && !ktpFile[0]) {
                return res.send({
                    success: false,
                    message: 'Foto KTP diperlukan'
                }).status(403)
            }
            if(!Array.isArray(simFile) && !simFile[0]) {
                return res.send({
                    success: false,
                    message: 'Foto SIM diperlukan'
                }).status(403)
            }
        }

        let text = '';
        switch (type) {
            case 'Get Quotation':
                subject = 'E - Quotation Citroen';
                const carGallery = car.Galleries.find(x => x.id === color);
                const carGalleryPrice = JSON.parse(carGallery.CarGallery.price).find(x => x.provinceId === provinceId);
                const carAccessory = JSON.parse(car.accessory);
                const selectedAccessory = carAccessory.find(x => x.name === accessory.name);
                const accessoryPrice = selectedAccessory.prices.find(x => x.provinceId === provinceId);
                const pdfPayload = {
                    status: 'Menunggu Konfirmasi',
                    quotationDate: moment().utcOffset(7).add(3, 'M').format('dddd, Do MMMM YYYY'),
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
                        name: car.name.replace('|', ''),
                        color: carGallery.name,
                        price: carGalleryPrice.price,
                        option: selectedAccessory.name,
                        optionDesc: selectedAccessory.desc,
                        optionPrice: accessoryPrice.price,
                        total: carGalleryPrice.price + accessoryPrice.price,
                        image: `https://api.citroen-info.id/${carGallery.path.split('public/')[1]}`
                    }
                }; 
                text = `Hallo, ${name}. \n\n We're excited to have you get started with Citroën! \n Pada email ini kami lampirkan e-Quotation untuk mobil Citroën Anda. Silahkan tunjukkan kode QR atau Nomor Seri di bawah ini kepada salah satu staff Citroën di sekitar Anda atau Anda dapat mendatangi Dealer resmi Citroën untuk melanjutkan proses pemesanan Anda! \n\n Jika Anda memiliki pertanyaan, biarkan kami membantu Anda! \n Hubungi kami melalui WhatsApp(${dealer.pic})`;

                // Render EJS to HTML
                const html = await ejs.renderFile(path.resolve(__dirname, '../../', 'assets/templates/quotation.ejs'), pdfPayload);

                // Generate PDF with Puppeteer in Buffer mode (no ReadableStream)
                const browser = await puppeteer.launch({
                    headless: true,
                    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                    protocolTimeout: 60000,
                    timeout: 60000  // Adjust the timeout as needed
                });
                const page = await browser.newPage();
                await page.setContent(html, { waitUntil: 'networkidle0' });
                const pdfBuffer = await page.pdf({
                    format: 'A3',
                    printBackground: true,
                    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
                });
                await browser.close();

                attachment = {
                    filename: `E-Quotation - ${car.name.replace('|', '')} | ${moment().utcOffset(7).format('D-M-YYYY')}.pdf`,
                    content: pdfBuffer
                };

                await sendMail({ to: email, bcc, subject, text, templateName: 'quotation_email', templateData: {name, number: '+6287844754575'},attachment });
                break;

            case 'Test Drive':
                subject = 'Citroen Booking';
                text = `Hallo, ${name}. \n\n We're excited to have you get started with Citroën! \n Anda telah mengirimkan permintaan untuk test drive mobil Citroën. Kami akan segera menghubungi Anda. \n\n Berikut informasi data anda yang telah kami terima: \n Nama \t: ${name}\n Email \t: ${email}\n Alamat Domisili \t: ${address}\n Telepon \t: ${phoneNumber}\n Model \t: ${car.name.replace('|', '')}\n Permintaan \t: ${type}`;
                await sendMail({ to: email, bcc, subject, templateName: 'test_drive', templateData: {name, email, province: province.name, city: city.name, phone: phoneNumber, dealer: selectedDealer.name, model: car.name.replace('|', ''), cs: '+6287844754575'}, text });
                break;
            case 'Test Drive 6 days':
                const ktpFileUrl = await uploadToDrive(ktpFile[0].path, ktpFile[0].originalname, 'ktp');
                const simFileUrl = await uploadToDrive(simFile[0].path, simFile[0].originalname, 'sim');
                const parsedClosestDealer = JSON.parse(closestDealer)
                const spreadsheetData = [
                    moment().utcOffset(7).format('M/D/YYYY HH:mm:ss'),   // Timestamp
                    name,                                   // Nama
                    phoneNumber.replace(/^0/, '+62'),       // Phone/Whatsapp
                    email,                                  // Email
                    address,                                // Alamat Domisili
                    parsedClosestDealer.name,               // Area Domisili
                    parsedClosestDealer.dealer,             //Dealer Terdekat 
                    car.name.replace('|', ''),              // Nama Mobil
                    noKtp,                                  // Nomor KTP
                    `=IMAGE("${ktpFileUrl}", 1)`,           // Foto KTP
                    ktpFileUrl,                             // Link Foto KTP
                    `=IMAGE("${simFileUrl}", 1)`,           // Foto Sim
                    simFileUrl,                             // Link Foto Sim
                  ];
                const range = 'Sheet1!A:M'; // Adjust the range as needed

                const sheets = google.sheets({ version: 'v4', auth });
                
                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                      values: [spreadsheetData],
                    },
                  });
                const ktpFullPath = path.join(path.resolve(__dirname, '../../'), ktpFile[0].path)
                const simFullPath = path.join(path.resolve(__dirname, '../../'), simFile[0].path)
                fs.access(ktpFullPath)
                    .then(() => {
                        return fs.unlink(ktpFullPath);
                    })
                    .then(() => {
                        console.log(`File unlinked successfully at path: ${ktpFullPath}`);
                    })
                    .catch((err) => {
                        console.error(`Error while trying to unlink the file at path: ${ktpFullPath}`, err);
                    });
                fs.access(simFullPath)
                    .then(() => {
                        return fs.unlink(simFullPath);
                    })
                    .then(() => {
                        console.log(`File unlinked successfully at path: ${simFullPath}`);
                    })
                    .catch((err) => {
                        console.error(`Error while trying to unlink the file at path: ${simFullPath}`, err);
                    });
                
                break
        }

        return res.status(200).send({ success: true, data });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ success: false, message: error.message });
    }
});

module.exports = router;