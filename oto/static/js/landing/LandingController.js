angular.module('oto')
.controller('LandingController', ['$rootScope', '$scope', '$location', 'Auth', function($rootScope, $scope, $location, Auth) {
    $scope.accessLevels = Auth.accessLevels;
}]);