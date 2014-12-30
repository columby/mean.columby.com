/**
 *
 * https://github.com/asafdav/ng-s3upload
 *
 * Sign: Get a signed request from columby to upload directly to Columby. { filetype, size, filename, accountId )
 * Upload: Upload directly to Amazon S3
 * Finish: Send a message to Columby to finish the upload process.
 *
 */

'use strict';

angular.module('columbyApp')

  .service('FileService', function ($http, $q) {

    ///**
    //*
    //* Read the xml response from S3
    //*
    //* @param s3Response
    //* @returns {{location: string, bucket: *, key: *, etag: *}}
    //*/
    //function handleS3Response(s3Response){
    //  var data = window.xml2json.parser(s3Response);
    //  return {
    //    location: decodeURIComponent(data.postresponse.location),
    //    bucket: data.postresponse.bucket,
    //    key: data.postresponse.key,
    //    etag: data.postresponse.etag
    //  };
    //}


    return {

      /******
       * Get a signed request for uploading to S3 from the server.
       *
       * @params: Object: { filetype, size, filename, accountId }
       *
       **/
      signS3: function (params) {
        return $http({
          method: 'GET',
          url: 'api/v2/file/sign',
          params: params
        }).then(function (result) {
          return result.data;
        });
      },

      /******
       * Upload a file to s3 with a signed request
       *
       * @param scope
       * @param s3Response
       * @param file
       *
       * @returns {*}
       *
       */
      upload: function (scope, s3Response, file) {

        var uri = 'https://' + s3Response.credentials.bucket + '.s3.amazonaws.com/';
        var deferred = $q.defer();

        scope.attempt = true;

        var fd = new FormData();
        fd.append('key', s3Response.credentials.file.key);
        fd.append('acl', s3Response.credentials.file.acl);
        fd.append('Content-Type', s3Response.credentials.file.filetype);
        fd.append('AWSAccessKeyId', s3Response.credentials.s3Key);
        fd.append('policy',s3Response.credentials.policy);
        fd.append('signature',s3Response.credentials.signature);
        fd.append('success_action_status', '201');
        fd.append("file", file);

        var xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", uploadProgress, false);
        xhr.addEventListener("load", uploadComplete, false);
        xhr.addEventListener("error", uploadFailed, false);
        xhr.addEventListener("abort", uploadCanceled, false);
        scope.$emit('s3upload:start', xhr);

        // Define event handlers
        function uploadProgress(e) {
          console.log('uploading', e);
          scope.$apply(function () {
            if (e.lengthComputable) {
              scope.progress = Math.round(e.loaded * 100 / e.total);
            } else {
              scope.progress = 'unable to compute';
            }
            var msg = {type: 'progress', value: scope.progress};
            scope.$emit('s3upload:progress', msg);
            if (typeof deferred.notify === 'function') {
              deferred.notify(msg);
            }

          });
        }

        function uploadComplete(e) {
          var xhr = e.srcElement || e.target;
          scope.$apply(function () {
            self.uploads--;
            scope.uploading = false;
            if (xhr.status === 201) { // successful upload
              console.log('Upload finished. ');
              scope.success = true;
              deferred.resolve(xhr);
              scope.$emit('s3upload:success', xhr, {path: uri + s3Response.credentials.file.key});
            } else {
              scope.success = false;
              deferred.reject(xhr);
              scope.$emit('s3upload:error', xhr);
            }
          });
        }

        function uploadFailed(e) {
          var xhr = e.srcElement || e.target;
          scope.$apply(function () {
            self.uploads--;
            scope.uploading = false;
            scope.success = false;
            deferred.reject(xhr);
            scope.$emit('s3upload:error', xhr);
          });
        }

        function uploadCanceled(e) {
          var xhr = e.srcElement || e.target;
          scope.$apply(function () {
            self.uploads--;
            scope.uploading = false;
            scope.success = false;
            deferred.reject(xhr);
            scope.$emit('s3upload:abort', xhr);
          });
        }

        // Send the file
        scope.uploading = true;
        this.uploads++;
        xhr.open('POST', uri, true);
        xhr.send(fd);

        return deferred.promise;
      },


      /******
       * Finish the S3 request.
       * Send a message to the server that the upload is finished.
       *
       * @param params
       * @returns {*}
       */
      finishS3: function(params) {
        return $http({
          method: 'POST',
          url: 'api/v2/file/s3success',
          data: {
            fileId: params.fid,
            url: params.url
          }
        }).then(function (result) {
          return result.data;
        });
      },


      /**
       *
       * Check if the file is an image
       *
       **/
      validateFile: function(filetype, type, target) {
        var validTypes;
        if (type === 'image') {
          validTypes = ['image/png', 'image/jpg', 'image/jpeg'];
          return (validTypes.indexOf(filetype) !== -1);
        } else if(type === 'file'){
          validTypes = ['application/pdf'];
          return (validTypes.indexOf(filetype) !== -1);
        }

        return false;
      }
    };
  });