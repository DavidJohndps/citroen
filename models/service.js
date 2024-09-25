'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Service.belongsToMany(models.Car, {
        through: 'CarService',
        as: 'Services',
        foreignKey: 'serviceId',
        type: DataTypes.UUID
      })
      Service.hasMany(models.CarService, {
        foreignKey: 'serviceId',
        type: DataTypes.UUID
      })
    }
  }
  Service.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    mileage: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    period: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Service',
  });
  return Service;
};