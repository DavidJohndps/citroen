'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Dealer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Dealer.belongsToMany(models.Facility, {
        through: 'DealerFacility',
        foreignKey: 'dealerId',
        sourceKey: 'id'
      })
      Dealer.hasMany(models.DealerFacility, {
        foreignKey: {
          name: 'dealerId'
        }
      })
      Dealer.belongsTo(models.User, {
        as: 'Customer Service',
        foreignKey: {
          name: 'pic'
        }
      })
      Dealer.belongsTo(models.User, {
        as: 'Dealer Head',
        foreignKey: {
          name: 'head'
        }
      })
      Dealer.belongsTo(models.Province, {
        as: 'Province',
        foreignKey: 'provinceId'
      })
      Dealer.belongsTo(models.City, {
        as: 'City',
        foreignKey: 'cityId'
      })
    }
  }
  Dealer.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pic: {
      type: DataTypes.STRING,
      allowNull: false
    },
    head: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    longitude: {
      type: DataTypes.STRING,
      allowNull: false
    },
    latitude: {
      type: DataTypes.STRING,
      allowNull: false
    },
  }, {
    sequelize,
    modelName: 'Dealer',
  });
  return Dealer;
};