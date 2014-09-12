'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema
;

/* --- FUNCTIONS --------------------------------------------------------------- */

function slugify(text) {

  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

/**
 * Validations
 */
var validateUniqueEmail = function(value, callback) {
  var User = mongoose.model('User');
  User.find({
    $and: [{
      email: value
    }, {
      _id: {
        $ne: this._id
      }
    }]
  }, function(err, user) {
    callback(err || user.length === 0);
  });
};

/**
 * User Schema
 */

var UserSchema = new Schema({

  /**
   * Account fields
   **/

  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email'],
    validate: [validateUniqueEmail, 'E-mail address is already in-use']
  },
  slug: {
    type: String,
    unique: true
  },
  username: {
    type: String,
    unique: true,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  roles: {
    type: Array,
    default: ['authenticated']
  },


  /**
   * Profile fields
   **/
  description: {
    type: String,
    required: false
  },
  headerImage: {
    type: String,
    default: '/columby/assets/img/header/images/header_bg_01.png'
  },
  headerPattern: {
    type: String,
    default: '/columby/assets/img/header/patterns/1.svg'
  },

  publicationAccounts: {
    personal:{},
    organisations: []
  },
  /**
   * Passwordless login, issued tokens
   **/
  jwt: {
    type: Array,
    default: []
  }
});



/**
 * Pre-save hook
 */
UserSchema.pre('save', function(next) {
  //if (this.isNew && this.provider === 'local' && this.password && !this.password.length)
  //return next(new Error('Invalid password'));

  //http://blog.benmcmahen.com/post/41122888102/creating-slugs-for-your-blog-using-express-js-and
  var self=this;
  var slug=slugify(self.username);
  self.set('slug', slug);

  next();
});




/**
 * Methods
 */
UserSchema.methods = {

  /**
   * HasRole - check if the user has required role
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */
  hasRole: function(role) {
    var roles = this.roles;
    return roles.indexOf('admin') !== -1 || roles.indexOf(role) !== -1;
  },

  /**
   * IsAdmin - check if the user is an administrator
   *
   * @return {Boolean}
   * @api public
   */
  isAdmin: function() {
    return this.roles.indexOf('administrator') !== -1;
  },

  createPersonalPublicationAccount: function(){

  },

  getPersonalPublicationAccount: function(){
    //return pubAccount;
  },

  getOrganisationPublicationAccounts: function(){

  }

};

UserSchema.statics.getAccount = function(id, cb) {
  console.log('id', id);
  var User = mongoose.model('User');
  var PublicationAccount = mongoose.model('PublicationAccount');

  // Get User
  User.findOne({_id: id._id}).exec(function(err, user) {
    if (err) cb({err:err});
    if (!user) cb({'Failed to load User ': id});
    if (user){
      console.log('user found', user);
      // check if personal account exists
      if (!user.publicationAccounts) {
        console.log('No publication accounts found');
        user.publicationAccounts = {};
      }
      if (!user.publicationAccounts.personal) {
        console.log('No personal publication account found');
        user.publicationAccounts.personal = {};
        // add personal account
        var pubAccount = new PublicationAccount({
          owner: user._id,
          accountType: 'personal',
          plan: 'free',
          name: user.username,
          slug: user.slug,
          description: user.description
        });
        user.publicationAccounts.personal = pubAccount;
        user.save(function(err){
          console.log('New saved user: ', user);

          cb({account: user});
        });
      } else {
        console.log('User: ', user);
        cb({account: user});
      }
    }
  });
};

UserSchema.statics.findBySlug = function(slug, cb) {
  var User = mongoose.model('User');

  User
    .findOne({slug: slug}, 'username description roles headerImage headerPattern')
    .exec(function(err,p){
      cb(err, p);
    });
};

mongoose.model('User', UserSchema);
