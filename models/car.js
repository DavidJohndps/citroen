'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Car extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Car.belongsToMany(models.Gallery, {
        through: 'CarGallery',
        foreignKey: 'carId',
      })
      Car.hasMany(models.CarGallery, {
        foreignKey: {
          name: 'carId'
        }
      })
      Car.belongsToMany(models.Service, {
        as: 'Services',
        through: 'CarService',
        foreignKey: 'carId',
      })
      Car.hasMany(models.CarService, {
        foreignKey: {
          name: 'carId'
        }
      })
    }
  }
  Car.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: true
    },
    brochure: {
      type: DataTypes.STRING,
      allowNull: false
    },
    img: {
      type: DataTypes.STRING,
      allowNull: false
    },
    accessory: {
      type: DataTypes.JSON,
      allowNull: false
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    highlight: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true
    },
    loanForm: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true
    },
  }, {
    sequelize,
    modelName: 'Car',
  });
  return Car;
};