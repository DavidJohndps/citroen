'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Facility extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Facility.belongsToMany(models.Dealer, {
        through: 'DealerFacility',
        foreignKey: 'facilityId',
        type: DataTypes.UUID
      })
      Facility.hasMany(models.DealerFacility, {
        foreignKey: 'facilityId',
        type: DataTypes.UUID
      })
    }
  }
  Facility.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING
    },
  }, {
    sequelize,
    modelName: 'Facility',
  });
  return Facility;
};