'use strict';

angular.module('columbyApp')
  .config(function ($stateProvider) {
    $stateProvider

      .state('account', {
        abstract: true,
        url: '/a',
        template: '<ui-view/>'
      })

      .state('account.view', {
        url: '/:slug',
        templateUrl: 'views/account/view.html',
        resolve: {
          // First try to fetch dataset.
          account: function(AccountSrv, $stateParams) {
            return AccountSrv.get({slug: $stateParams.slug}).$promise;
          }
        },
        controller: 'AccountCtrl',
        data: {
          bodyClasses: 'page account view',
          permission: 'view account'
        }
      })

      .state('account.edit', {
        url: '/:slug/edit',
        templateUrl: 'views/account/edit.html',
        resolve: {
          // First try to fetch dataset.
          account: function(AccountSrv, $stateParams) {
            return AccountSrv.get({slug: $stateParams.slug}).$promise;
          }
        },
        controller: 'AccountEditCtrl',
        data: {
          bodyClasses: 'account organisation edit',
          permission: 'edit organisation'
        }
      });
  });
