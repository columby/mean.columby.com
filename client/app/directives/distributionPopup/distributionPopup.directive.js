'use strict';

angular.module('columbyApp')

  .controller('DistributionNewCtrl', function($log, $scope, $modalInstance, distribution, FileService, toaster, ngProgress, DistributionSrv){

    $scope.distribution = distribution;
    $scope.distribution.license="cc0";
    $scope.upload = {
      inProgress: false,
      finished: false
    };
    $scope.wizard={

      steps: ['start','data','metadata','finish'],
      step:1,
      cancelShow: true,
      previousShow: false,
      previousDisabled: true,
      nextShow: false,
      nextDisabled: true,
      finishShow: false,
      finishDisabled: true
    };


    /**
     * File is uploaded, finish it at the server.
     *
     * @param params
     */
    function finishUpload(params) {
      $log.log('upload: ', $scope.upload);
      var params = {
        fid: $scope.upload.file.id,
        url: 'https://' + $scope.upload.credentials.bucket + '.s3.amazonaws.com/' + $scope.upload.credentials.file.key
      };
      $log.log('params', params);

      FileService.finishS3(params).then(function(res){
        $log.log('upload finished',res);
        $scope.upload.file = null;
        if (res.id){
          var d = {
            id: $scope.distribution.id,
            file_id: res.id
          };
          DistributionSrv.update(d, function(result){
            console.log(result);
            if (result.id){
              $scope.distribution.file_id = result.file_id;
              $scope.wizard.step = 4;
              $scope.wizard.finishShow = true;
              $scope.wizard.finishDisabled = false;
            }
          });
        }
      });
    }



    /** ---------- SCOPE FUNCTIONS ------------------------------------------------ **/

    // Initialize a file upload
    $scope.initUpload = function(){
      $scope.distribution.type = 'Download';
      $scope.wizard.step = 2;
    };

    /**
     *
     * Handle file select
     *
     * @param files
     */
    $scope.onFileSelect = function(files) {
      var file = files[0];
      // Check if there is a file
      if (!file) {
        return toaster.pop('warning',null,'No file selected.');
      }
      // Check if there is already an upload in progress
      if ($scope.upload.file){
        return toaster.pop('warning',null,'There is already an upload in progress. ');
      }

      $scope.upload.file = file;

      ngProgress.start();

      var params = {
        filetype: file.type,
        type: 'datafile',
        filesize: file.size,
        filename: file.name,
        accountId: $scope.distribution.account_id
      };

      $log.log('Uploading with params: ', params);

      FileService.signS3(params).then(function(response) {
        console.log('Response sign: ', response);
        // signed request is valid, send the file to S3
        if (response.file) {
          // Initiate the upload
          FileService.upload($scope, response, file).then(function (res) {
            console.log(res);
            // File upload is done
            if (res.status === 201 && res.statusText === 'Created') {
              ngProgress.complete();
              $log.log($scope.upload);
              $scope.upload.file = response.file;
              $scope.upload.credentials = response.credentials;
              console.log('Finishing uploading. ');
              finishUpload();
            } else {
              return toaster.pop('warning', null, 'Something went wrong finishing the upload. ');
            }
          }, function (error) {
            console.log('Error', error);

          }, function (evt) {
            console.log('Progress: ' + evt.value);
            ngProgress.set(evt.value);
          });
        } else {
          toaster.pop('error', null, 'Sorry, there was an error. Details: ' + reesponse.msg);
          console.log(response);
        }
      });
    };

    $scope.save = function(){
      console.log('saving');
      $scope.updateInProgress = true;
      $scope.distribution.status='draft';
      var d = {
        id: $scope.distribution.id,
        status: 'public'
      };
      // save metadata
      DistributionSrv.update(d, function(response){
        console.log(response);
        $scope.updateInProgress = false;
        if (response.id){
          // all is well, next step.
          // close distribution
          $scope.close();
        } else {
          toaster.pop('warning', null, 'Something went wrong. ' + response);
        }
      });
    };

    // Initialize a source link
    $scope.initSync = function(){
      $scope.distribution.type = 'remoteService';
      $scope.wizard.step = 3;
    };

    $scope.validateLink = function(){
      // validate if we can read the source
      $scope.distribution.validation = {
        status: 'inprogress',
        valid: false,
        result: null
      };

      DistributionSrv.validateLink({url:$scope.distribution.accessUrl}, function(response){
        console.log('r', response);
        $scope.distribution.validation = {
          status: 'done',
          result: response
        };
        $scope.distribution.valid = response.valid;
        // TODO: what mediatype for a link?
        $scope.distribution.mediaType = 'link';
        // TODO: Wat format for a link?
        $scope.distribution.format = 'link';

        $scope.wizard.nextShow = true;
        $scope.wizard.nextDisabled = false;
      });
    };

    $scope.submitLink = function(){
      console.log('submitting link.');

      // Update the distribution (save the url and validity
      DistributionSrv.update($scope.distribution, function(response){
        console.log('submitlink respononse, ', response);
        if (response.id){
          //toaster.pop('success',null,'Distribution updated.');
          // Go to metadata screen
          $scope.wizard.step = 4;
        }
      });
    };

    $scope.next = function(){
      console.log($scope.wizard.step);
      if ($scope.wizard.step === 3){
        $scope.wizard.step = 4;
        $scope.wizard.nextShow=false;
        $scope.wizard.finishShow=true;
        $scope.wizard.finishDisabled=false;
      }
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };

    $scope.close = function(){
      $modalInstance.close($scope.distribution);
    };
  })


  .directive('distributionPopup', function($modal,  $rootScope, EmbedlySrv, DistributionSrv, ngDialog, FileService, toaster){
    return {
      templateUrl: 'app/directives/distributionPopup/distributionPopup.html',
      restrict: 'EA',
      scope: {
        dataset: '='
      },

      controller: function($log, $scope){

        /* Initialize */
        function initiate() {

          $scope.distribution = {
            dataset_id: $scope.dataset.id
          };

          DistributionSrv.save($scope.distribution, function(res){
            if (res.id){
              $scope.distribution = res;
              $scope.distribution.account_id = $scope.dataset.account_id;

              //$scope.dataset.distributions.push(res);
              //toaster.pop('success', null, 'New source created.');

              var modalInstance = $modal.open({
                templateUrl: 'app/directives/distributionPopup/distributionPopupContent.html',
                controller: 'DistributionNewCtrl',
                size: 'lg',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                  distribution: function() {
                    return res;
                  }
                }
              });
              modalInstance.result.then(function (distribution) {
                toaster.pop('info', null, 'Datasource saved.');
                $scope.dataset.distributions.push(distribution);
                console.log(distribution);
              }, function () {
                // Delete the created datasource
                DistributionSrv.delete($scope.distribution, function(res){
                  console.log('deleted');
                  console.log(res);
                });
                $log.info('Modal dismissed at: ' + new Date());
              });

            } else {
              toaster.pop('danger', null, 'Something went wrong.');
            }
          });
        }

        //initNew
        $scope.initNewDistribution = function() {
          initiate();
        };
      }
    };
  });
