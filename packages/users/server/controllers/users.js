'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  config = require('meanio').loadConfig(),
  mandrill = require('mandrill-api/mandrill'),
  mandrill_client = new mandrill.Mandrill(config.mandrill.key),
  uuid = require('node-uuid')
;

/**
 * Auth callback
 */
exports.authCallback = function(req, res) {
  res.redirect('/');
};


exports.passwordlessLogin = function(req,res,next){

  var email = req.body.email;
  // Check if email-address is registered
  User.findOne({'email': email}, function(err,user){
    if (err) {
      res.json(200, {
        status: 'error',
        error: err
      });
      console.log('error: ', err);
    } else if(!user){
      res.status(200).json({
        status: 'error',
        error: 'User not found'
      });
      console.log('User not found.');
    } else {
      console.log('User found: ', user);
      // User found, create a new token
      var token = uuid.v4();
      console.log('Token created.', token);
      user.loginToken = token;
      user.loginTokenCreated = new Date();
      user.save(function(err){
        if (err) {
          console.log('error',err);
          res.json(401,{'error': err});
        } else {
          console.log('User token updated.', user);
          // Send the new token by email
          mandrill_client.messages.send({
            'message': {
              'html': req.protocol + '://' + req.get('host') + '/#!/signin?token=' + user.loginToken,
              'text': req.protocol + '://' + req.get('host') + '/#!/signin?token=' + user.loginToken,
              'subject': 'Login at Columby',
              'from_email': 'admin@columby.com',
              'from_name': 'Columby Admin',
              'to': [{
                'email': user.email,
                'name': user.username,
                'type': 'to'
              }],
              'headers': {
                'Reply-To': 'admin@columby.com'
              },
            }
          }, function(result){
            if (result[0].status === 'sent') {
              res.json(200,{
                status: 'success',
                statusMessage: 'VerificationToken sent.'
              });
            } else {
              res.json({
                status: 'error',
                statusCode: 400,
                statusMessage: 'Error sending mail.',
                error: result
              });
            }

          });
        }
      });
    }
  });
};

exports.verify = function(req,res,next) {

  var token = req.query.token;
  console.log('Received token: ' +token);
  User.findOne({'loginToken': token}, function(err, user){
    if (err || !user) {
      console.log('Error finding user with loginToken: ' + token);
      res.json({
        status: 'error',
        statusMessage: 'Error finding the verification token. ',
        error: err
      });
    } else {
      // update token
      user.loginToken = '';
      user.save(function(err){
        console.log('err', res);
        console.log('user', user);
        req.logIn(user, function(err) {
          if (err) return next(err);
          return res.json({
            status: 'success',
            user: user,
          });
        });
      });
    }
  });
};


/**
 * Logout
 */
exports.signout = function(req, res) {
  req.logout();
  //res.redirect('/');
  res.json(200,{
    status: 'success',
    statusMessage: 'Successfully logged out. '
  });
};


exports.getProfile = function(req,res){
  console.log(req.query.slug);
  User.findBySlug(req.query.slug, function(err,p){
    if (err) return res.json({status: 'error'});
    return res.json({
      status:'success',
      profile: p
    });
  });
};
/**
 * Create user
 */
exports.create = function(req, res, next) {
  var user = new User(req.body);

  user.provider = 'local';

  // because we set our user.provider to local our models/user.js validation will always be true
  //req.assert('name', 'You must enter a name').notEmpty();
  req.assert('email', 'You must enter a valid email address').isEmail();
  req.assert('username', 'Username cannot be more than 20 characters').len(1, 20);
  //req.assert('password', 'Password must be between 8-20 characters long').len(8, 20);
  //req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();
  if (errors) {
    res.json({
      status: 'error',
      statusCode: 400,
      statusMessage: errors
    });
  } else {
    // Hard coded for now. Will address this with the user permissions system in v0.3.5
    user.roles = ['authenticated'];
    user.username = user.username;
    user.loginToken = uuid.v4();

    console.log('saving user', user);

    user.save(function(err) {
      if (err) {
        console.log('Saving user error:', err);
        switch (err.code) {
          case 11000:
            res.json({
              status: 'error',
              statusCode: 400,
              statusMessage: [{
                msg: 'Email already taken',
                param: 'email'
              }]
            });
            break;
          case 11001:
            res.json({
              status: 'error',
              statusCode: 400,
              statusMessage: [{
                msg: 'Username already taken',
                param: 'username'
              }]
            });
            break;
          default:
            var modelErrors = [];

            if (err.errors) {

              for (var x in err.errors) {
                modelErrors.push({
                  param: x,
                  msg: err.errors[x].message,
                  value: err.errors[x].value
                });
              }
              res.json({
                status: 'error',
                statusCode: 400,
                statusMessage: modelErrors
              });
            }
        }

      } else {
        //sendmail
        mandrill_client.messages.send({
          'message': {
            'html': req.protocol + '://' + req.get('host') + '/#!/signin?token=' + user.loginToken,
            'text': req.protocol + '://' + req.get('host') + '/#!/signin?token=' + user.loginToken,
            'subject': 'Login at Columby',
            'from_email': 'admin@columby.com',
            'from_name': 'Columby Admin',
            'to': [{
              'email': user.email,
              'name': user.username,
              'type': 'to'
            }],
            'headers': {
              'Reply-To': 'admin@columby.com'
            },
          }
        }, function(result){
          console.log('Mail result.', result);
          if (result[0].status === 'sent') {
            res.json(200,{
              status: 'success',
              statusMessage: 'VerificationToken sent.'
            });
          } else {
            res.json({
              status: 'error',
              statusCode: 400,
              statusMessage: 'Error sending mail.',
              error: result
            });
          }

        });
      }
    });
  }
};
/**
 * Send User
 */
exports.me = function(req, res) {
  res.json(req.user || null);
};

/**
 * Find user by id
 */
exports.user = function(req, res, next, id) {
  User
    .findOne({
      _id: id
    })
    .exec(function(err, user) {
      if (err) return next(err);
      if (!user) return next(new Error('Failed to load User ' + id));
      req.profile = user;
      next();
    });
};
