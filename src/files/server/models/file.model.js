'use strict'

var path = require('path')
var Hashids = require('hashids')
var hashids = new Hashids('Salt', 8)

module.exports = function (sequelize, DataTypes) {
  /**
   *
   * Slugify a string.
   *
   */
  function slugify (text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')       // Replace spaces with -
      .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
      .replace(/\-\-+/g, '-')     // Replace multiple - with single -
      .replace(/^-+/, '')         // Trim - from start of text
      .replace(/-+$/, '')        // Trim - from end of text
                                  // Limit characters
  }

  /**
   *
   * Schema definition
   *
   */
  var File = sequelize.define('File', {

    shortid: {
      type: DataTypes.STRING,
      unique: true
    },

    type: {
      type: DataTypes.ENUM,
      values: [ 'image', 'datafile', 'file' ]
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    filetype: {
      type: DataTypes.STRING
    },
    title: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.STRING
    },
    url: {
      type: DataTypes.STRING,
      isUrl: true
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    size: {
      type: DataTypes.INTEGER
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  }, {
    classMethods: {
      // Create associations to other models
      associate: function (models) {
        // // Avatar association
        // File.hasOne(models.Account, {
        //   foreignKey: 'avatar_id',
        //   as: 'avatar'
        // });
        //   // Header image association
        // File.hasOne(models.Account, {
        //   foreignKey: 'headerimg_id',
        //   as: 'headerImg'
        // });
        //
        // Each file should be connected to 1 publication account
        File.belongsTo(models.Account, {
          constraints: false,
          as: 'account'
        })
      }
    }
  })

  /**
   *
   * Create a slug based on the account name
   *
   */
  File.beforeCreate(function (model, fn) {
    var filename = model.filename
    var ext = path.extname(filename)
    var basename = path.basename(filename, ext)
    filename = slugify(basename) + ext
    model.filename = filename
  })

  File.afterCreate(function (model, fn) {
    // update filename and shortid
    // var filename = model.filename;
    // var id = model.id;
    // var ext = path.extname(filename);
    // var basename = path.basename(filename, ext);
    var date = parseInt(String(Date.now()), 10)
    model.updateAttributes({
      // filename: basename + '-' + id + ext,
      shortid: hashids.encode(date + String(model.id))
    }).then(function (model) {

    }).catch(function (err) {
      console.log('err', err)
    })
  })

  return File
}
