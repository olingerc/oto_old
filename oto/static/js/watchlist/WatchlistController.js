app.controller('WatchlistController', ['$scope', '$http' ,'Auth', function($scope, $http, Auth) {
   $scope.searchFor = 'tvshows';
   $scope.setSearchFor = function(type) {
      $scope.searchFor = type;
   };
   $scope.query = 'Dexter';
   $scope.activeSearchResult = null;
   
   $scope.setActiveSearchResult = function(series) {
      $scope.activeSearchResult = series;
   };
   
   $scope.searchResults = [];
   
   $scope.searchSeries = function() {
      if ($scope.query) {
         $http.get('/searchseries', {params:{'query':$scope.query}})
            .success(function(response) {
               console.log(response);
               $scope.searchResults = response;
            })
            .error(function(response) {
               console.log(response.error);
            });
      }
   };
    
}]);
