const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config();

const cors = require('cors');
const bodyParser = require('body-parser');
const PORT = process.env.PORT;

const {sequelize} = require('./models')
const routes = require('./routes')

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'assets/images')));
app.use('/api', routes)

sequelize.authenticate()
  .then(() => {
    console.log('Database connection verified successfully.');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
  })
  .catch(err => {
    console.error('Error verifying database connection:', err);
  });