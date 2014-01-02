app.controller('LandingController', ['$scope', 'Auth', function($scope, Auth) {
    $scope.accessLevels = Auth.accessLevels;
}]);