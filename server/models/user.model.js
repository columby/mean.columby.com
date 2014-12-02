'use strict';

var Hashids = require('hashids'),
  hashids = new Hashids('Salt', 8);

module.exports = function(sequelize, DataTypes) {

  /**
   *
   * Schema definition
   *
   */
  var User = sequelize.define('User',
    {
      shortid: {
        type: DataTypes.STRING,
        unique: true
      },
      uuid:{
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
      },
      email : {
        type      : DataTypes.STRING,
        allowNull : false,
        unique    : true,
        validate  : {
          isEmail: true
        }
      },
      verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      // migration from beta.columby.com
      drupal_name: {
        type: DataTypes.STRING
      },
      drupal_created: {
        type: DataTypes.STRING
      }
    },{
      classMethods: {
        associate: function(models) {
          User.hasMany(models.Token);
          // Use a specific table for extra fields (role).
          User.hasMany(models.Account, {through: models.AccountsUsers});
        }
      }
    }
  );

  /**
   *
   * Set shortid after creating a new account
   *
   */
  User.afterCreate( function(model) {
    model.updateAttributes({
      shortid: hashids.encode(parseInt(String(Date.now()) + String(model.id)))
    }).success(function(){}).error(function(){});
  });

  return User;
};
