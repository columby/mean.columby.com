'use strict';

var jwt = require('jwt-simple');
var moment = require('moment');
var models = require('../models/index');
var config = require('../config/config');
var request = require('request');

/**
 *
 */
exports.checkJWT = function (req, res, next) {
  req.jwt = req.jwt || {};

  // Decode the token if present
  if (req.headers.authorization){
    var token = req.headers.authorization.split(' ')[1];
    try {
      var payload = jwt.decode(token, config.jwt.secret, 'base64');
      // Check token expiration date
      if ( (payload.exp) && (payload.exp > moment().unix()) ) {
        req.jwt = payload;
      }
      next();
    } catch (err){
      console.log('err ', err);
    }
  }
};

/**
 *
 * Validate the user from the JWT token
 *
 */
exports.checkUser = function (req, res, next) {
  req.user = req.user || {};

  // Check if there is an authorization token supplied
  if (!req.user.email && (req.headers && req.headers.authorization)){
    // get the token
    var token = req.headers.authorization.split(' ')[1];
    // Send a request to auth0 to get user info based on token
    request.post(
      config.auth0.domain + 'tokeninfo',
      { form: { id_token: token } },
      function (error, response, body) {
        if (!error && response.statusCode === 200) {
          // parse result to json
          var u = JSON.parse(body);
          // validate if user
          if (u.email) {
            req.user = u;
          }
        }
        // Always proceed
        next();
      }
    );
  } else {
    console.log('Anonymous');
    next();
  }
};

// Validate if a user is logged in
exports.ensureAuthenticated = function (req, res, next) {
  if (req.user && req.user.email){
    next();
  } else {
    return res.json({status: 'error', message: 'Not authenticated'});
  }
};
