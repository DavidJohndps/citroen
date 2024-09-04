'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DealerFacility extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      DealerFacility.belongsTo(models.Dealer, {
        foreignKey: 'dealerId',
        type: DataTypes.UUID
      })
      DealerFacility.belongsTo(models.Facility, {
        foreignKey: 'facilityId',
        type: DataTypes.UUID
      })
    }
  }
  DealerFacility.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    dealerId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    facilityId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    }
  }, {
    sequelize,
    modelName: 'DealerFacility',
  });
  return DealerFacility;
};