'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CarRegion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CarRegion.init({
    carId: DataTypes.UUID,
    regionId: DataTypes.UUID,
    price: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'CarRegion',
  });
  return CarRegion;
};