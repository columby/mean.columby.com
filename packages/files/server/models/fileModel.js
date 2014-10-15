'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * Dataset Schema
 */
var FileSchema = new Schema({

  s3_key        : { type: String, required: false },
  filename      : { type: String, required: false },
  title         : { type: String, required: false },
  description   : { type: String, required: false },
  url           : { type: String, required: false },
  status        : { type: String, default: 'Draft' },
  type          : { type: String },
  size          : { type: Number },

  owner         : {type: Schema.ObjectId, ref: 'User' },

  createdAt     : { type: Date, default: Date.now }
});


/**
 * Validations
 */
FileSchema.path('title').validate(function(name) {
    return name.length;
}, 'Title cannot be blank');

FileSchema.path('title').validate(function (name) {
  return name.length < 150;
}, 'Title should be under 150 characters');


mongoose.model('File', FileSchema);
