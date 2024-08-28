'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CarGallery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CarGallery.init({
    carId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    galleryId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    path: DataTypes.STRING,
    color: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'CarGallery',
  });
  return CarGallery;
};