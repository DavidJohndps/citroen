const config = {
  "development": {
    "username": process.env.DB_DEV_USERNAME,
    "password": process.env.DB_DEV_PASSWORD,
    "database": process.env.DB_DEV_NAME,
    "host": process.env.DB_DEV_HOST,
    "dialect": process.env.DB_DEV_DIALECT,
    "port": process.env.D_DEVB_PORT
  },
  "test": {
    "username": "root",
    "password": null,
    "database": "citroen",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "port": 3306
  },
  "production": {
    "username": process.env.DB_PROD_USERNAME,
    "password": process.env.DB_PROD_PASSWORD,
    "database": process.env.DB_PROD_NAME,
    "host": process.env.DB_PROD_HOST,
    "dialect": process.env.DB_PROD_DIALECT,
    "port": process.env.DB_PROD_PORT
  }
}

module.exports = config
