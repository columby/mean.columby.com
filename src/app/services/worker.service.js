'use strict';

angular.module('columbyApp')

  .service('WorkerSrv', function($http, appConstants) {

    return {

      add: function(job) {
        $log.debug(appConstants.workerRoot);
        return $http.post(appConstants.workerRoot + '/api/job', job)
          .then(function (response) {
            return response.data;
          });
      }

      // job status

      // job log

      // delete job

      // list jobs based on ID

      //

    };
  });
