'use strict';

angular.module('mean.datasets').controller('DatasetsController', ['$scope', '$state', 'Global', 'DatasetSrv',
  function($scope, $state, Global, DatasetSrv) {
    $scope.global = Global;
    $scope.package = {
      name: 'datasets'
    };
  }
]);


angular.module('mean.datasets')

.controller('DatasetViewCtrl', [
  '$rootScope', '$scope', '$state', '$stateParams', 'DatasetSrv', 'DatasetDistributionSrv', 'DatasetReferencesSrv', 'MetabarSrv', 'AuthSrv', 'toaster',
  function($rootScope, $scope, $state, $stateParams, DatasetSrv, DatasetDistributionSrv, DatasetReferencesSrv, MetabarSrv, AuthSrv, toaster) {

    /***   INITIALISATION   ***/
    //var editWatcher;               // Watch for model changes in editmode

    $scope.editMode = false;       // edit mode is on or off
    $scope.contentEdited = false;  // models is changed or not during editmode

    // check if request is for edit mode
    if ($state.current.data && $state.current.data.editMode) {
      $scope.editMode = true;
    }


    /***   FUNCTIONS   ***/
    function getDataset(){
      $scope.contentLoading = true;  // show loading message while loading dataset

      DatasetSrv.get({
        datasetId: $stateParams.datasetId
      }, function(dataset) {
        // add acquired dataset to the scope
        $scope.dataset = dataset;
        $scope.contentLoading = false;
        if (!$scope.dataset.draft){
          $scope.dataset.draft={};
        }

        // create summary
        var summary = '<p>';
        // check for file source
        if (!dataset.sources) {
          summary += 'There is no data for this dataset available yet. ';
        } else if (!dataset.sources.primary) {
          summary += 'There is no primary source for this dataset yet. ';
        } else if (dataset.sources.primary.type) {
          summary += 'This dataset if of the type <strong>' + dataset.sources.primary.type + '</strong>.';
        }
        // check for license
        if (!dataset.license) {
          summary += 'There is no license defined. ';
        } else {
          summary += 'The licens for this dataset is <strong>' + dataset.license.name + '</strong>';
        }
        $scope.summary = summary + '</p>';

        $scope.dataset.canEdit = (dataset.account._id === $rootScope.selectedAccount._id);

      });
    }

    function initiateNewDataset(){
      $scope.dataset = {
        title: 'New title',
        description: '<p>Description</p>',
        publishStatus: 'unpublished',
        draft:{},
        account: $rootScope.selectedAccount._id
      };
    }

    function toggleEditMode(mode){
      if (!mode){
        $scope.editMode = !$scope.editMode;
      } else if (mode===true) {
        $scope.editMode = mode;
        // watch title change
        $scope.$watch('dataset.title', function(newVal, oldVal) {
          if (newVal !== oldVal){
            var dataset = {
              _id: $scope.dataset._id,
              title: newVal
            };

            DatasetSrv.update({datasetId: dataset._id}, dataset,function(res){
              if (res._id){
                toaster.pop('success', 'Updated', 'Dataset updated.');
              }
            });
          }
        });

      } else if (mode===false) {
        $scope.editMode = mode;
        // turn watching off.
        //editWatcher();
        $rootScope.$broadcast('editMode::false');
      }
    }

    function addReference(ref){

      // construct the reference
      var reference = {
        description: ref.description,
        image: ref.images[0].url,
        url: ref.url,
        title: ref.title,
        provider_name: ref.provider_name,
        provider_display: ref.provider_dis
      };

      // save reference
      DatasetReferencesSrv.save({datasetId:$scope.dataset._id, reference: reference}, function(res){
        console.log(res);
      });
      // add to scope
      if (!$scope.dataset.references) {
        $scope.dataset.references = [];
      }
      $scope.dataset.references.push(ref);

      // close popup
      $scope.addReference = false;
    }


    /***   SCOPE FUNCTIONS   ***/

    /*** Editmode functions */
    $scope.enterEditmode = function(){
      toggleEditMode(true);
    };
    $scope.exitEditMode = function(){
      toggleEditMode(false);
    };

    /* dataset functions */
    $scope.updateDescription = function() {
      var dataset = {
        _id: $scope.dataset._id,
        description: $scope.dataset.description
      };

      DatasetSrv.update({datasetId:dataset._id},dataset,function(res){
        if (res._id){
          toaster.pop('success', 'Updated', 'Dataset description updated.');
        }
      });
    };

    $scope.update = function(){

      var dataset = {
        _id: $scope.dataset._id,
        title: $scope.dataset.title,
        description: $scope.dataset.description
      };

      DatasetSrv.update({datasetId: dataset._id}, dataset,function(res){
        if (res._id){
          $scope.dataset = res;
          toaster.pop('success', 'Updated', 'Dataset updated.');
          toggleEditMode();
        }
      });
    };

    $scope.create = function(){
      DatasetSrv.save($scope.dataset, function(res){
        if (res._id) {
          toaster.pop('success', 'Created', 'Dataset created.');
          $state.go('dataset.view', {datasetId:res._id});
        }
      });
    };

    /*** Distribution functions */
    $scope.openDistributionPopup = function() {
      $scope.addDistribution = true;
    };

    $scope.closeDistributionPopup = function() {
      $scope.addDistribution = false;
    };

    $scope.checkDistributionLink = function(){
      console.log('checking distribution');
      $scope.newDistribution.validationMessage = 'The link was validated!';
      $scope.newDistribution.distributionType = 'link';
      $scope.newDistribution.valid = true;
    };

    $scope.createDistribution = function() {
      console.log('Creating ditribution');
      // validate link
      if ($scope.newDistribution.valid) {
        // add link to model
        if (!$scope.dataset.hasOwnProperty('distributions')) { $scope.dataset.distributions = []; }
        if ($scope.newDistribution){
          var distribution = {
            // Columby Stuff
            uploader          : $rootScope.user._id,
            distributionType  : $scope.newDistribution.distributionType,
            publicationStatus : 'public',
            // DCAT stuff
            accessUrl         : $scope.newDistribution.link
          };
          console.log('attaching distribution', distribution);

          DatasetDistributionSrv.save({
            datasetId:$scope.dataset._id,
            distribution: distribution}, function(res){
              console.log(res);
              if (res.status === 'success'){
                $scope.dataset.distributions.push(res.source);
                toaster.pop('success', 'Updated', 'Dataset updated.');
                $scope.newDistribution = null;
                $scope.addDistribution = false;
              } else {
                toaster.pop('danger', 'Error', 'Something went wrong.');
              }
            }
          );
        }
      } else {
        toaster.pop('danger', 'Error', 'No new distribution');
      }
    };


    $scope.deleteDistribution = function(index){
      var datasetId = $scope.dataset._id;
      var sourceId = $scope.dataset.sources[ index]._id;

      DatasetDistributionSrv.delete({datasetId:datasetId, sourceId:sourceId}, function(res){
        if (res.status === 'success') {
          $scope.dataset.sources.splice(index,1);
        }
      });
    };

    /*** Reference functions */
    $scope.openReferenceModal = function() {
      $scope.addReference = true;
    };

    $scope.closeReferenceModal = function() {
      $scope.addReference = false;
    };
    $scope.deleteReference = function(index){
      console.log(index);
      var datasetId = $scope.dataset._id;
      var referenceId = $scope.dataset.references[ index]._id;

      DatasetReferencesSrv.delete({datasetId:datasetId, referenceId:referenceId}, function(res){
        console.log(res);
        if (res.status === 'success') {
          $scope.dataset.references.splice(index,1);
        }
      });

    };



    /* --------- ROOTSCOPE EVENTS ------------------------------------------------------------ */
    $rootScope.$on('embedly::new', function(a,b){
      console.log('a',a);
      console.log('b',b);
      addReference(b);
    });


    /* --------- INIT ------------------------------------------------------------------------ */
    if (!$scope.editMode) {
      getDataset();
    } else {
      initiateNewDataset();
      toggleEditMode(true);
    }
  }
]);


angular.module('mean.datasets').controller('DatasetEditCtrl', ['$scope', '$state', '$stateParams', '$timeout', '$interval', 'DatasetSrv',
  function($scope, $state, $stateParams, $timeout, $interval, DatasetSrv) {

    /*** SCOPE INITIALIZATION ***/
    $scope.contentLoading = true;

    /*** VARIABLES ***/
    var autoSaveTimer;


    $scope.isEmpty = function(obj) {
      return angular.equals({}, obj);
    };

    /*** FUNCTIONS ***/
    function autoSave() {
      console.log('Starting autosave');
      // check for changes in the model
      if ($scope.draftWorking.description === '') {
        delete $scope.draftWorking.description;
      }

      if (!angular.equals($scope.draftMaster, $scope.draftWorking)) {

        $scope.autosaveInProgress = true;

        var d = {
          id: $scope.dataset._id,
          draft: $scope.draftWorking
        };

        DatasetSrv.autoSave(d).then(function(res){

          console.log('Autosave response', res);
          // Update the main dataset
          if (res.draft === null ) {
            res.draft = {};
          }
          $scope.dataset = angular.copy(res);
          console.log('res', $scope.dataset);
          // update the master copy with the received values, or the published values
          resetDrafts();

          $scope.autosaveInProgress = false;
        });
      }
    }

    function startAutoSave(){
      autoSaveTimer = $interval(autoSave, 5000);
    }
    function stopAutoSave(){
      if (angular.isDefined(autoSaveTimer)) {
        $interval.cancel(autoSaveTimer);
        autoSaveTimer = undefined;
      }
    }
    function resetDrafts(){
      console.log('updating draft models');

      if (!$scope.dataset.draft) $scope.dataset.draft = {};

      $scope.draftMaster = {};
      $scope.draftWorking = {};

      $scope.draftMaster.title = $scope.dataset.draft.title || $scope.dataset.title || null;
      $scope.draftMaster.description = $scope.dataset.draft.description || $scope.dataset.description || null;
      $scope.draftWorking = angular.copy($scope.draftMaster);
      console.log('draftMaster', $scope.draftMaster);
      console.log('draftWorking', $scope.draftWorking);
    }

    // Load dataset
    function loadDataset(){
      DatasetSrv.retrieve($stateParams.datasetId).then(function(res){
        if (res._id) {
          console.log('Dataset received', res);
          $scope.dataset = res;

          // inititiate the draft master version (for reference)
          resetDrafts();

          // start the timer for autosave (notice: no check if server response is ok... )
          startAutoSave();

          // Open sidebar
          angular.element('.editorSidebar').addClass('isOpen');
          angular.element('body').addClass('editorSidebarOpen');

        } else {
          console.log('error or something', res);
        }

        $scope.contentLoading = false;
      });
    }

    /*** ROOTSCOPE EVENTS ***/
    $scope.$on('stopAutosave', stopAutoSave());

    /*** INIT ***/
    loadDataset();
  }
]);
