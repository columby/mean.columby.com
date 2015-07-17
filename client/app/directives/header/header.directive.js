'use strict';

angular.module('columbyApp')

  .directive('header', function($document, $window) {

    return {
      restrict: 'EA',
      templateUrl: 'app/directives/header/header.html',

      controller: function($window, $timeout, $rootScope,$scope,$state,AuthSrv) {
        var scrollOriginal = $window.pageYOffset;

        $scope.hideHeader = false;

        // Hide header on scrollDown > 100px
        angular.element($window).bind("scroll", function() {
          var scrollNew = $window.pageYOffset;
          if ( (scrollNew > 100) && (scrollNew > scrollOriginal) ){
            $scope.hideHeader = true;
          } else {
            $scope.hideHeader=false;
          }
          $scope.$apply();
          scrollOriginal=scrollNew;
        });

        $scope.toggleSidebar = function($event){
          $event.preventDefault();
          $event.stopPropagation();
          $rootScope.$broadcast('toggleSidebar');
        }

        $scope.logout = function(){
          AuthSrv.logout();
          $state.go('home');
          ngNotify.set('You are now signed out', 'notice');
        }
      }
    };
  });
