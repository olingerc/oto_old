app.controller('WatchlistController', ['$scope', '$http' ,'Auth', function($scope, $http, Auth) {
   
   /*
    * Initial
    */
   
   $scope.searchFor = 'tvshows';
   $scope.showSearchResults = false;
   $scope.query = 'Dexter';
   $scope.searchResults = [];
   $scope.searching = false;
   
   /*
    * Common Series/Movies
    */
   
   $scope.setSearchFor = function(type) {
      $scope.searchFor = type;
   };
   
   /*
    * Series
    */
   

   $scope.seriesCollection = [];
   $scope.loadingCollection = true;
   var getSeries = function() {
         $http.get('/getseries')
            .success(function(response) {
               $scope.seriesCollection = response;
               $scope.loadingCollection = false;
            })
            .error(function(response) {
               console.log(response.error);
               $scope.loadingCollection = false;
            });
   };
   getSeries();

   $scope.searchSeries = function() {
      if ($scope.query) {
         $scope.searching = true;
         $scope.showSearchResults = true;
         $http.get('/searchseries', {params:{'query':$scope.query}})
            .success(function(response) {
               $scope.searchResults = response;
               $scope.searching = false;
            })
            .error(function(response) {
               console.log(response.error);
               $scope.searching = false;
            });
      }
   };
   
   $scope.addSeries = function(show) {
      if ($scope.seriesCollection.indexOf(show) < 0) {
         //TODO Allow only one object with sme series name. indexOf not good for new search with same name
         $http.post('/addseries', {show:show})
            .success(function(show) {
               console.log(show);
               $scope.seriesCollection.push(show);
            })
            .error(function(response) {
               console.log(response.error);
            });
      }
   };
   
   $scope.removeSeries = function(showindex) {
      $scope.seriesCollection.splice(showindex, 1);
   };
   
}]);
