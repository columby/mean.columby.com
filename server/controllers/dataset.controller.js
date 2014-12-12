'use strict';

/**
 *
 * Dependencies
 *
 */
var _ = require('lodash'),
    models = require('../models/index'),
    Dataset = require('../models/index').Dataset,
    Account = require('../models/index').Account,
    File = require('../models/index').File,
    Sequelize = require('sequelize')
  ;


exports.extractlink = function(req,res) {
  console.log(req.params);
  console.log(req.query);
  var uri = req.query.uri;
  console.log(uri);

  // get link properties
  if (uri){
    req.head(uri, function(err, result, body){
      if (res.statusCode !== 200) {
        console.log('invalid url');
      } else {
        // check for file
        console.log('valid url');
        // check for arcgis

      }


      res.json({
        headers: result,
        body: body
      });
      console.log('content-type:', result.headers['content-type']);
      console.log('content-length:', result.headers['content-length']);
    });
  } else {
    res.json({err:'no uri'});
  }
};


/**
 *
 * Get list of datasets.
 *
 */
exports.index = function(req, res) {

  // Define WHERE clauses
  var filter = {
    private: false
  };

  if (req.query.accountId){
    filter.account_id = req.query.accountId;
  }

  // Set (default) limit
  var limit = req.query.limit || 10;
  // Set (default) offset
  var offset = req.query.offset || 0;

  Dataset
    .findAndCountAll({
      where: filter,
      limit: limit,
      offset: offset,
      order: 'created_at DESC',
      include: [
        { model: Account, include: [
          { model: File, as: 'avatar'}
        ] }
      ]
    })
    .success(function(datasets) {
      var r = {};
      r.count = datasets.count;
      r.rows = [];
      for (var i=0;i<datasets.rows.length; i++){
        var s = datasets.rows[ i].dataValues;
        s.account = s.Account.dataValues;
        delete s.Account;
        r.rows.push(s);
      }
      return res.json(r);
    })
    .error(function(err){
      console.log(err);
      return handleError(res, err);
    })
  ;
};

/**
 *
 * Show a single dataset.
 *
 */
exports.show = function(req, res) {
  console.log('show dataset:', req.params.id);
  Dataset.findOne({
    where: { shortid: req.params.id },
    include: [
      { model: models.Distribution },
      { model: File, as: 'headerImg'},
      { model: Account, include: [
        { model: File, as: 'avatar'},
        { model: File, as: 'headerImg'}
      ] }
    ]
  }).success(function(dataset){
    var d = dataset.dataValues;
    d.account = dataset.Account;
    delete d.Account;
    d.distributions = dataset.Distributions;
    delete d.Distributions;
    return res.json(d);
  }).error(function(err){
    console.log(err);
  });
};

/**
 *
 * Create a new dataset.
 *
 */
exports.create = function(req, res) {

  var d = req.body;
  //console.log('Creating new dataset: ', req.body);
  // Handle tags
  if (d.tags) { d.tags = d.tags.split(','); }

  // Create a new dataset
  Dataset.create(req.body).success(function(dataset) {
    //console.log('Dataset created: ', dataset);
    dataset.setAccount(req.body.account.id).success(function(dataset) {
      console.log('Dataset account attached: ', dataset);
      return res.json(dataset);
    }).error(function(err) {
      handleError(res,err);
    });
  }).error(function(err){
    handleError(res,err);
  });
};

// Updates an existing dataset in the DB.
exports.update = function(req, res) {

  if(req.body._id) { delete req.body._id; }

  Dataset.find(req.params.id).success(function(dataset){
    if(!dataset) { return res.send(404); }

    // Set new header image if needed
    if (req.body.headerImg){
      dataset.setHeaderImg(req.body.headerImg);
    }

    dataset.updateAttributes(req.body).success(function(dataset) {
      return res.json(dataset);
    }).error(function(err) {
      handleError(res,err);
    });
  }).error(function(err){
    handleError(res,err);
  });
};

// Deletes a dataset from the DB.
exports.destroy = function(req, res) {
  Dataset.findById(req.params.id, function (err, dataset) {
    if(err) { return handleError(res, err); }
    if(!dataset) { return res.send(404); }
    dataset.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};


/*-------------- DISTRIBUTIONS ---------------------------------------------------------------*/
exports.listDistributions = function(req, res) {
  console.log(req.params);
  var id = req.params.id;
  console.log(id);
};

exports.getDistribution = function(req,res,id){
  console.log(req.params);
};

exports.createDistribution = function(req, res) {
  console.log('creating distribution');
  console.log(req.body);
  var id = req.params.id;
  var distribution = req.body.distribution;
  console.log('d', distribution);
  distribution._id = mongoose.Types.ObjectId();
  Dataset
    .findOne({_id: id})
    .exec(function(err,dataset){
      if (err) return res.json({status:'error', err:err});
      if (!dataset) return res.json({error:'Failed to load dataset', err:err});
      if (!dataset.distributions) {
        dataset.distributions = [ ];
      }
      dataset.distributions.push(distribution);
      dataset.save(function(err){
        res.json({status:'success', distribution: distribution});
      });
    })
  ;
};

exports.updateDistribution = function(req, res, id) {
  console.log(req.params);
};

exports.destroyDistribution = function(req, res) {

  var id = String(req.params.id);
  var distributionId = String(req.params.distributionId);

  Dataset.findOne({_id:id},function(err,dataset){
    if (err) return res.json({status:'error', err:err});
    if (!dataset) return res.json({error:'Failed to load dataset', err:err});
    for (var i=0; i < dataset.distributions.length; i++){
      if (String(dataset.distributions[ i]._id) === distributionId){
        dataset.distributions.splice(i,1);
      }
    }
    dataset.save();
    res.json({status:'success'});
  });
};


/*-------------- REFERENCES --------------------------------------------------------------*/
exports.listReferences = function(req, res) {
  console.log(req.params);
  var id = req.params.id;
  console.log(id);
};

exports.getReference = function(req,res,id){
  console.log(req.params);
};

exports.createReference = function(req, res) {
  var id = req.params.id;
  var reference = req.body.reference;
  reference._id = mongoose.Types.ObjectId();
  Dataset
    .findOne({_id: id})
    .exec(function(err,dataset){
      if (err) return res.json({status:'error', err:err});
      if (!dataset) return res.json({error:'Failed to load dataset', err:err});
      if (!dataset.references) {
        dataset.sources = [ ];
      }
      dataset.references.push(reference);
      dataset.save(function(err){
        res.json({status:'success', reference: reference});
      });
    })
  ;
};

exports.updateReference = function(req, res, id) {
  console.log(req.params);
};

// Delete a source attached to a dataset
exports.destroyReference = function(req, res) {

  var id = String(req.params.id);
  var referenceId = String(req.params.referenceId);

  Dataset.findOne({_id:id},function(err,dataset){
    if (err) return res.json({status:'error', err:err});
    if (!dataset) return res.json({error:'Failed to load dataset', err:err});
    for (var i=0; i < dataset.references.length; i++){
      if (String(dataset.references[ i]._id) === referenceId){
        dataset.references.splice(i,1);
      }
    }
    dataset.save();
    res.json({status:'success'});
  });
};



function handleError(res, err) {
  console.log('Dataset error,', err);
  return res.send(500, err);
}
