'use strict';

angular.module('columbyApp')

  .service('DataService', function($http, configSrv) {

    return {

      sql: function(query) {
        console.log(configSrv.apiRoot);
        return $http({
          method: 'GET',
          url: configSrv.apiRoot + '/v2/data/sql',
          params: {q:query}})
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
