const { Router } = require('express');
const router = Router();
const sendMail = require('../../middleware/mailer');
const { Car, CarGallery, Gallery, City } = require('../../models');
const {google} = require('googleapis');  // Use standard puppeteer package
const auth = require('../../middleware/googleAuth')
const moment = require('moment');

moment.locale('id');

router.post('/', async (req, res) => {
    try {
        const { body: data } = req;
        const { type, eventName, name, phoneNumber, email, cityId, age, marriageStatus, profession, knowFrom, planBuy, planWhen, testDriveCar: carId, testDriveScore, interestingFeature, notInterestFeature  } = data;

        const spreadsheetId = type === 'event' ? process.env.SHEET_EVENT_ID : process.env.SHEET_BASALT_ID
        
        let car, range

        if (carId) {
            car = await Car.findOne({
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
        }

        const city = await City.findOne({
            where: {
                id: cityId
            }
        })

        const spreadsheetData = []
        const sheets = google.sheets({ version: 'v4', auth });
        switch (type) {
            case 'event':
                spreadsheetData.push(
                    moment().utcOffset(7).format('M/D/YYYY HH:mm:ss'),   // Timestamp
                    eventName,
                    name,                                   // Nama
                    phoneNumber.replace(/^0/, '+62'),       // Phone/Whatsapp
                    email,                                  // Email
                    city.name,                                // Alamat Domisili
                    age,                                    // umur
                    marriageStatus,                         // status
                    profession,                             // profesi
                    knowFrom,                               // info pameran dari mana
                    planBuy,                                // rencana beli mobil
                    planWhen,                               // rencana kapan beli mobil
                    carId ? car.name.replace('|', '') : 'Belum',              // mobil yang di test drive
                    testDriveScore,                         // score test drive
                    interestingFeature,                     // fitur menarik
                    notInterestFeature,                     // fitur tidak menarik
                );
                range = 'Sheet1!A:P'; // Adjust the range as needed
                
                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                      values: [spreadsheetData],
                    },
                  });
                break
            case 'basalt':
                spreadsheetData.push(
                    moment().utcOffset(7).format('M/D/YYYY HH:mm:ss'),   // Timestamp
                    name,                                   // Nama
                    phoneNumber.replace(/^0/, '+62'),       // Phone/Whatsapp
                    email,                                  // Email
                    city.name,                                // Alamat Domisili
                    age,                                    // umur
                    marriageStatus,                         // status
                    profession,                             // profesi
                    knowFrom,                               // info pameran dari mana
                    planBuy,                                // rencana beli mobil
                    planWhen,                               // rencana kapan beli mobil
                    interestingFeature,                     // fitur menarik
                    notInterestFeature,                     // fitur tidak menarik
                );
                range = 'Sheet1!A:M'; // Adjust the range as needed
                
                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                      values: [spreadsheetData],
                    },
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