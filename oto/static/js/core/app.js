'use strict';

var app = angular.module('oto', [
   'oto.filters',
   'ui.bootstrap',
   'ui.utils',
   'angularFileUpload',
   'ngRoute',
   'ngResource',
   'ngCookies',
   ])
	.config(['$routeProvider', '$locationProvider', '$httpProvider',
      function($routeProvider, $locationProvider, $httpProvider) {

         var access = routingConfig.accessLevels;

         //Define routes also on server!
      	$routeProvider.when('/', {
      	   templateUrl: '/static/partials/landing.html',
      		access: access.user
      	});
      	$routeProvider.when('/about', {
      		templateUrl: '/static/partials/about.html',
      		access: access.public
      	});
         $routeProvider.when('/admin', {
            templateUrl: '/static/partials/admin.html',
            access: access.admin
         });
         $routeProvider.when('/login', {
            templateUrl: '/static/partials/login.html',
            access: access.anon
         });
      	$routeProvider.when('/notes', {
      	   templateUrl: '/static/partials/card-list.html',
      		access: access.user
      	});
         $routeProvider.when('/automation', {
            templateUrl: '/static/partials/automation.html',
            access: access.user
         });
         $routeProvider.when('/401', {
            templateUrl: '/static/partials/401.html',
            access: access.public
         });
      	$routeProvider.otherwise({
      		templateUrl: '/static/partials/404.html',
      		access: access.public
      	});

      	$locationProvider.html5Mode(true);

         var interceptor = ['$location', '$q', function($location, $q) {
            function success(response) {
               return response;
            }

            function error(response) {
               if(response.status === 401) {
                  $location.path('/login');
                  return $q.reject(response);
               } else {
                  return $q.reject(response);
               }
            }

            return function(promise) {
               return promise.then(success, error);
            };
         }];

         $httpProvider.responseInterceptors.push(interceptor);
      }
	])
   .run(['$rootScope', '$location', 'Auth',
      function ($rootScope, $location, Auth) {
         //init rootscope objects. I want to have separete objects for my modules
         $rootScope.core = {};
         $rootScope.notes = {};

         $rootScope.$on("$routeChangeStart",
            function (event, next, current) {
               $rootScope.core.error = null;
               if (!Auth.authorize(next.access)) {
                  if(Auth.isLoggedIn()) {
                     if ($rootScope.core.savedLocation) {
                        if (Auth.authorize(next.access)) {
                           $location.path($rootScope.core.savedLocation);
                        } else {
                           $location.path('/401').replace();
                        }
                     } else {
                        $location.path('/401').replace();
                     }
                  } else {
                     $rootScope.core.savedLocation = $location.url();
                     $location.path('/login');
                  }
               }
           }
         );
     }])
;
