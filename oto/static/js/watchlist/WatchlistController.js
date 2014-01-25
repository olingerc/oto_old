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
   $scope.searching = false;
   
   $scope.searchSeries = function() {
      if ($scope.query) {
         $scope.searching = true;
         $http.get('/searchseries', {params:{'query':$scope.query}})
            .success(function(response) {
               console.log(response);
               $scope.searchResults = response;
               $scope.searching = false;
            })
            .error(function(response) {
               console.log(response.error);
               $scope.searching = false;
            });
      }
   };
    
}]);
