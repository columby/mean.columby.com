'use strict';

var express = require('express'),
  distributionCtrl = require('../controllers/distribution.controller'),
  distributionPerms = require('../permissions/distribution.permission'),
  auth = require('../controllers/auth.controller'),
  router = express.Router();


module.exports = function(app){


  /**
   * Distribution Routes
   *
   **/
  router.get('/',
    distributionCtrl.index
  );

  router.post('/',
    auth.checkJWT,
    auth.checkUser,
    auth.ensureAuthenticated,
    distributionPerms.canCreate,
    distributionCtrl.create
  );

  router.post('/validate-link',
    auth.checkJWT,
    auth.checkUser,
    auth.ensureAuthenticated,
    distributionCtrl.validateLink);

  router.get('/:id',
    distributionCtrl.show);

  router.put('/:id',
    auth.checkJWT,
    auth.checkUser,
    auth.ensureAuthenticated,
    distributionPerms.canUpdate,
    distributionCtrl.update);

  router.delete('/:id',
    auth.checkJWT,
    auth.checkUser,
    auth.ensureAuthenticated,
    distributionPerms.canDelete,
    distributionCtrl.destroy);


  app.use('/v2/distribution',router);

};
