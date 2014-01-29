app.controller('WatchlistController', ['$scope', '$http', function($scope, $http) {
   
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
         //TODO Allow only one object with same series name. indexOf not good for new search with same name
         $http.post('/addseries', {show:show})
            .success(function(show) {
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
   
   $scope.setLastDownloaded = function(show) {
      show.lastdownloaded=show.activeEpisode;
         $http.post('/updateseries', {showid:show.id, lastdownloaded: show.activeEpisode})
            .success(function(response) {
               //console.log(response);
            })
            .error(function(response) {
               console.log(response.error);
            });       
   };
   
   $scope.setLastWatched = function(show) {
      show.lastwatched=show.activeEpisode;
      $http.post('/updateseries', {showid:show.id, lastwatched: show.activeEpisode})
         .success(function(response) {
            //console.log(response);
         })
         .error(function(response) {
            console.log(response.error);
         });       
   };
   
   $scope.setActiveEpisode = function(series, ep) {
      series.activeEpisode=ep;
   };
   
   $scope.epIsNextAired = function(show, ep) {
      if (show.nextEpisode) {
         var seEp = ep.substring(0, ep.indexOf(' '));
         var seNext = show.nextEpisode.split(",")[1];
         if (seEp.trim() === seNext.trim()) {
            return true;
         }
      }
      return false;
   };
   
}]);
  
