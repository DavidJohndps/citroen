'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CarService extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CarService.belongsTo(models.Car, {
        foreignKey: {
          name: 'carId',
          type: DataTypes.UUID
        }
      })
      CarService.belongsTo(models.Service, {
        foreignKey: {
          name: 'serviceId',
          type: DataTypes.UUID
        }
      })
    }
  }
  CarService.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    carId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    part: {
      type: DataTypes.JSON,
      allowNull: false
    },
    price: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'CarService',
  });
  return CarService;
};