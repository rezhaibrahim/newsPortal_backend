'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here
      // Users.associate = Users.belongsTo(models.Roles, { foreignKey: 'roleId' })
    }
  };
  Users.init({
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'Name already used'
      },
      validate: {
        notNull: {
          msg: 'Please insert your name'
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'Email already used'
      },
      validate: {
        notNull: {
          msg: 'Please insert your email'
        },
        isEmail: {
          args: true,
          msg: 'Email not valid'
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Users'
  })
  // Users.hasOne(Roles, { foreignKey: 'roleId' })
  return Users
}
