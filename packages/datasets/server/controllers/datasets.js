'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Dataset = mongoose.model('Dataset'),
  _ = require('lodash');


/**
 * Find dataset by id
 */
exports.dataset = function(req, res, next, id) {

  Dataset.load(id, function(err, dataset) {
    if (err) return next(err);
    if (!dataset) return next(new Error('Failed to load dataset ' + id));
    req.dataset = dataset;
    next();
  });
};

/**
 * Create an dataset
 */
exports.create = function(req, res) {
  var dataset = new Dataset(req.body);
  dataset.user = req.user;

  dataset.save(function(err) {
    if (err) {
      return res.json(500, {
        error: 'Cannot save the dataset'
      });
    }
    res.json(dataset);

  });
};

/**
 * Update an dataset
 */
exports.update = function(req, res) {
  var dataset = req.dataset;

  dataset = _.extend(dataset, req.body);

  dataset.save(function(err) {
    if (err) {
      return res.json(500, {
        error: 'Cannot update the dataset'
      });
    }
    res.json(dataset);

  });
};

/**
 * Delete an dataset
 */
exports.destroy = function(req, res) {
  var dataset = req.dataset;

  dataset.remove(function(err) {
    if (err) {
      return res.json(500, {
        error: 'Cannot delete the dataset'
      });
    }
    res.json(dataset);

  });
};

/**
 * Show an dataset
 */
exports.show = function(req, res) {
  res.json(req.dataset);
};

/**
 * List of Datasets
 */
exports.all = function(req, res) {
  Dataset
    .find()
    .sort('-created')
    .populate('user', 'name username')
    .exec(function(err, datasets) {
      if (err) {
        return res.json(500, {
          error: 'Cannot list the datasets'
        });
      }
      res.json(datasets);
    })
  ;
};


// Update draft of a dataset.
exports.autosave = function(req,res) {

  var id = req.body.id;
  var draft = req.body.draft;
  console.log('Received draft', draft);
  Dataset
    .findOne({_id: id})
    .select()
    .exec(function(err,dataset){
      // If status is draft, save it directly
      console.log(dataset);
      if (dataset.publishStatus === 'draft') {
        console.log('updating draft directly');
        if (draft.title) dataset.title = draft.title;
        if (draft.description) dataset.description = draft.description;
        dataset.draft = null;
      } else {
        // otherwise save the changes as draft.
        console.log('saving draft');
        dataset.draft = draft;
      }
      dataset.save(function(err){
        if (err) console.log(err);
        console.log(dataset);
        res.json(dataset);
      });
    })
  ;
};