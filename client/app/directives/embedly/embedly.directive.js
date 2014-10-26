'use strict';

angular.module('columbyApp')
  .directive('embedly', function (EmbedlySrv) {
    return {
      restrict: 'EA',
      scope:{
        urlsearch: '@'
      },
      link: function (scope, element, attrs) {
        scope.$watch('urlsearch', function(newVal) {
          console.log('new code', newVal);

          var previousEmbedCode = scope.embedCode;

          if (newVal) {
            EmbedlySrv.embed(newVal)
              .then(function(data){
                switch(data.data.type) {
                  case 'video':
                    scope.embedCode = data.data.html;
                    break;
                  case 'photo':
                    scope.embedCode = '<img src="' + data.data.url + '">';
                    break;
                  default:
                    scope.embedCode = '';
                }
                if(previousEmbedCode !== scope.embedCode) {
                  // embed code was changed from last call and has to be replaced in DOM
                  element.html('<div>' + scope.embedCode + '</div>');
                }
              }, function(error) {
                // promise rejected
                var previousEmbedCode = scope.embedCode;
                scope.embedCode = '';
                if(previousEmbedCode !== scope.embedCode) {
                  element.html('<div>' + scope.embedCode + '</div>');
                }
              });
          }
        });
      }
    };
  });
