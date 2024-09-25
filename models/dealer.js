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
      Dealer.belongsToMany(models.Gallery, {
        through: 'DealerGallery',
        foreignKey: 'dealerId',
        sourceKey: 'id'
      })
      Dealer.hasMany(models.DealerGallery, {
        foreignKey: {
          name: 'dealerId'
        }
      })
      Dealer.belongsTo(models.User, {
        as: 'Dealer Head',
        foreignKey: {
          name: 'head'
        }
      })
      Dealer.belongsTo(models.User, {
        as: 'Service Head',
        foreignKey: {
          name: 'service'
        }
      })
      Dealer.belongsTo(models.User, {
        as: 'Sales Head',
        foreignKey: {
          name: 'sales'
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
    hotline: {
      type: DataTypes.STRING,
      allowNull: false
    },
    workingHours: {
      type: DataTypes.JSON,
      allowNull: false
    },
    pic: {
      type: DataTypes.STRING,
      allowNull: false
    },
    head: {
      type: DataTypes.STRING,
      allowNull: true
    },
    service: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sales: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mapLink: {
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
    img: {
      type: DataTypes.STRING
    }
  }, {
    sequelize,
    modelName: 'Dealer',
  });
  return Dealer;
};