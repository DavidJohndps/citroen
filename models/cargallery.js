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
      CarGallery.belongsTo(models.Car, {
        foreignKey: {
          name: 'carId',
          type: DataTypes.UUID
        }
      })
      CarGallery.belongsTo(models.Gallery, {
        foreignKey: {
          name: 'galleryId',
          type: DataTypes.UUID
        }
      })
    }
  }
  CarGallery.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    carId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    galleryId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    type: {
      type: DataTypes.ENUM,
      values: ['One-Tone', 'Two-Tone'],
      allowNull: false
    },
    price: {
      type: DataTypes.JSON,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'CarGallery',
  });
  return CarGallery;
};