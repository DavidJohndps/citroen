require('dotenv').config(); // Loads environment variables from a .env file

module.exports = {
  development: {
    username: process.env.DB_DEV_USERNAME || "root",
    password: process.env.DB_DEV_PASSWORD || "",
    database: process.env.DB_DEV_NAME || "citroen",
    host: process.env.DB_DEV_HOST || "127.0.0.1",
    port: process.env.D_DEVB_PORT || "3306",
    dialect: process.env.DB_DEV_DIALECT || "mysql"
  },
  test: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'database_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
  },
  production: {
    username: process.env.DB_PROD_USERNAME,
    password: process.env.DB_PROD_PASSWORD,
    database: process.env.DB_PROD_NAME,
    host: process.env.DB_PROD_HOST,
    port: process.env.DB_PROD_PORT,
    dialect: process.env.DB_PROD_DIALECT,
    // dialectOptions: {
    //   ssl: {
    //     require: true, // This is necessary if you're connecting to a production DB with SSL
    //     rejectUnauthorized: false, // This will not check for SSL certificate verification
    //   },
    // },
  },
};
