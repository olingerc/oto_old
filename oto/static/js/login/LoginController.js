'use strict';

function loginFormController ($rootScope, $scope, $location, Auth) {

   $scope.loginFormState = {
      loginError: false
   };

    $scope.login = function() {
        Auth.login({
               username: $scope.user.username,
               password: $scope.user.password,
            },
            function(res) {
               if ($rootScope.savedLocation && $rootScope.savedLocation !== '/login') {
                  $location.path($rootScope.savedLocation);
               } else {
                  $location.path('/');
               }
            },
            function(err) {
               $scope.loginFormState.loginError = true;
            });
    };
}
