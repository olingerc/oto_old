'use strict';
app.controller('loginFormController', ['$rootScope', '$scope', '$location', 'Auth', function ($rootScope, $scope, $location, Auth) {
   $scope.loginFormState = {
      loginError: false
   };
   $scope.rememberme = true;

   $scope.login = function() {
      Auth.login({
         username: $scope.user.username,
         password: $scope.user.password,
         rememberme: $scope.rememberme,
      },
      function(res) {
         if ($rootScope.core.savedLocation && $rootScope.core.savedLocation !== '/login') {
            $location.path($rootScope.core.savedLocation);
         } else {
            $location.path('/');
         }
      },
      function(err) {
         $scope.loginFormState.loginError = true;
      });
   };

}]);
