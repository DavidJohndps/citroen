'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Gallery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Gallery.belongsToMany(models.Car, {
        through: 'CarGallery',
        foreignKey: 'galleryId',
        type: DataTypes.UUID
      })
      Gallery.hasMany(models.CarGallery, {
        foreignKey: 'galleryId',
        type: DataTypes.UUID
      })
      Gallery.belongsToMany(models.Dealer, {
        through: 'DealerGallery',
        foreignKey: 'galleryId',
        type: DataTypes.UUID
      })
      Gallery.hasMany(models.CarGallery, {
        foreignKey: 'galleryId',
        type: DataTypes.UUID
      })
    }
  }
  Gallery.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // Automatically generate UUID
      primaryKey: true,
    },
    name: DataTypes.STRING,
    path: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Gallery',
  });
  return Gallery;
};