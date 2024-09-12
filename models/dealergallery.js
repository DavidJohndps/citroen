'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DealerGallery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      DealerGallery.belongsTo(models.Dealer, {
        foreignKey: {
          name: 'dealerId',
          type: DataTypes.UUID
        }
      })
      DealerGallery.belongsTo(models.Gallery, {
        foreignKey: {
          name: 'galleryId',
          type: DataTypes.UUID
        }
      })
    }
  }
  DealerGallery.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    dealerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    galleryId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'DealerGallery',
  });
  return DealerGallery;
};