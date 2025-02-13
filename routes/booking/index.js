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
const { google } = require('googleapis');  // Use standard puppeteer package
const auth = require('../../middleware/googleAuth')
const moment = require('moment');

moment.locale('id');

router.post('/', uploadGallery.fields([{ name: 'ktp', maxCount: 1 }, { name: 'sim', maxCount: 1 }]), async (req, res) => {
    try {
        const { body: data } = req;
        const { type, carData: carId, selectedColor: color, selectedAccessory: accessory, KTPName: name, noKtp, PhoneNumber: phoneNumber, email, provincies: provinceId, city: cityId, fullAddress: address, code: promoCode, area: closestDealer, dealer: selectedDealer } = data;

        const spreadsheetId = process.env.SHEET_ID
        const spreadsheetLeadId = process.env.SHEET_LEAD_ID

        const car = await Car.findOne({
            where: { id: carId },
            include: [
                {
                    model: Gallery,
                    attributes: ['id', 'name', 'path'],
                    through: {
                        model: CarGallery,
                        attributes: ['id', 'type', 'price', 'cityPrice']
                    }
                }
            ]
        });

        let dealer, province, city, attachment, subject, ktpFile, simFile;
        const bcc = 'citroen.sales.id@gmail.com,citroen.telemarketing@gmail.com,gabriel.felicia@citroen.indomobil.co.id,care@citroen.indomobil.co.id,ferdinan.hendra@citroen.indomobil.co.id,galih.pamungkas@citroen.indomobil.co.id,heri.kurniawan@citroen.indomobil.co.id,ulung.windi@citroen.indomobil.co.id';

        if (type === 'Get Quotation') {
            dealer = await Dealer.findOne({
                where: {
                    id: selectedDealer
                }
            });
            province = await Province.findOne({ where: { id: dealer.provinceId } });
            city = await City.findOne({
                where: {
                    provinceId: province.id, 
                    name: {
                        [Op.like]: `%${cityId}%`
                    }
                }
            });
        }
        if (type === 'Test Drive') {
            province = await Province.findOne({ where: { id: provinceId } });
            city = await City.findOne({ where: { id: cityId, provinceId } });
        }
        if (type === 'Test Drive 6 days') {
            ktpFile = req.files.ktp
            simFile = req.files.sim
            if (!Array.isArray(ktpFile) && !ktpFile[0]) {
                return res.send({
                    success: false,
                    message: 'Foto KTP diperlukan'
                }).status(403)
            }
            if (!Array.isArray(simFile) && !simFile[0]) {
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
                // const carGalleryPrice = JSON.parse(carGallery.CarGallery.price).find(x => x.provinceId === province.id);
                const carGalleryPrice = JSON.parse(carGallery.CarGallery.cityPrice).find(x => {
                    const exist = new RegExp(x.city, 'i').test(city.name || '');
                    console.log(`Checking city match for ${x.city} against ${city.name}: ${exist}`);
                    return exist;
                });
                const carAccessory = JSON.parse(car?.accessory);
                const selectedAccessory = carAccessory?.find(x => x?.name === accessory?.name);
                const accessoryPrice = selectedAccessory?.prices?.find(x => x?.provinceId === province.id);
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
                        dealer: dealer,
                        promoCode
                    },
                    orderQuantity: 1,
                    vehicle: {
                        id: car.id,
                        name: car.name.replace('|', ''),
                        color: carGallery.name,
                        price: (carGalleryPrice?.price || 0),
                        option: selectedAccessory?.name || 'Tanpa Aksesories',
                        optionDesc: selectedAccessory?.desc || 'No Accessory',
                        optionPrice: accessoryPrice?.price || 0,
                        total: (carGalleryPrice?.price || 0) + (accessoryPrice?.price || 0),
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

                await sendMail({ to: email, bcc, subject, text, templateName: 'quotation_email', templateData: { name, number: '+6287844754575' }, attachment });
                const spreadsheetGetQuotationSheetData = [
                    moment().utcOffset(7).format('M/D/YYYY HH:mm:ss'),   // Timestamp
                    name,                                   // Nama
                    phoneNumber.replace(/^0/, '+62'),       // Phone/Whatsapp
                    email,                                  // Email
                    address,                                // Alamat Domisili
                    car.name.replace('|', ''),              // Nama Mobil
                    promoCode
                ];
                const rangeGetQuotation = 'GetQuotation!A:G'; // Adjust the range as needed

                const sheetsGetQuotation = google.sheets({ version: 'v4', auth });

                await sheetsGetQuotation.spreadsheets.values.append({
                    spreadsheetId: spreadsheetLeadId,
                    range: rangeGetQuotation,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [spreadsheetGetQuotationSheetData],
                    },
                });
                break;

            case 'Test Drive':
                subject = 'Citroen Booking';
                text = `Hallo, ${name}. \n\n We're excited to have you get started with Citroën! \n Anda telah mengirimkan permintaan untuk test drive mobil Citroën. Kami akan segera menghubungi Anda. \n\n Berikut informasi data anda yang telah kami terima: \n Nama \t: ${name}\n Email \t: ${email}\n Alamat Domisili \t: ${address}\n Telepon \t: ${phoneNumber}\n Model \t: ${car.name.replace('|', '')}\n Permintaan \t: ${type}\n Kode Promo \t: ${promoCode}\n`;
                await sendMail({ to: email, bcc, subject, templateName: 'test_drive', templateData: { name, email, province: province.name, city: city.name, phone: phoneNumber, dealer: selectedDealer.name, model: car.name.replace('|', ''), promoCode , cs: '+6287844754575' }, text });
                const spreadsheetTestDriveSheetData = [
                    moment().utcOffset(7).format('M/D/YYYY HH:mm:ss'),   // Timestamp
                    name,                                   // Nama
                    phoneNumber.replace(/^0/, '+62'),       // Phone/Whatsapp
                    email,                                  // Email
                    address,                                // Alamat Domisili
                    car.name.replace('|', ''),              // Nama Mobil
                    promoCode
                ];
                const rangeTestDrive = 'TestDrive!A:G'; // Adjust the range as needed

                const sheetsTestDrive = google.sheets({ version: 'v4', auth });

                await sheetsTestDrive.spreadsheets.values.append({
                    spreadsheetId: spreadsheetLeadId,
                    range: rangeTestDrive,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [spreadsheetTestDriveSheetData],
                    },
                });
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
                const spreadsheetTestDriveDaysSheetData = [
                    moment().utcOffset(7).format('M/D/YYYY HH:mm:ss'),   // Timestamp
                    name,                                   // Nama
                    phoneNumber.replace(/^0/, '+62'),       // Phone/Whatsapp
                    email,                                  // Email
                    address,                                // Alamat Domisili
                    car.name.replace('|', ''),              // Nama Mobil
                    promoCode
                ];
                const rangeTestDriveDays = 'TestDrive!A:G'; // Adjust the range as needed

                const sheetsTestDriveDays = google.sheets({ version: 'v4', auth });

                await sheetsTestDriveDays.spreadsheets.values.append({
                    spreadsheetId: spreadsheetLeadId,
                    range: rangeTestDriveDays,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [spreadsheetTestDriveDaysSheetData],
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