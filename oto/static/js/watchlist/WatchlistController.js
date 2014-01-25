app.controller('WatchlistController', ['$scope', 'Auth', function($scope, Auth) {
   $scope.searchFor = 'tvshows';
   $scope.setSearchFor = function(type) {
      $scope.searchFor = type;
   };
   $scope.query = '';
   $scope.activeSearchResult = null;
   
   $scope.setActiveSearchResult = function(series) {
      $scope.activeSearchResult = series;
   };
   
   $scope.searchResults = [
      {
         'name': 'Conan Barbarian',
         'firstAired': '2013-01-02',
         'status':'ended',
         'totalSeasons':3,
         'totalEpisodes':20,
         'nextEpisode':'2013-01-02',
         'network':'CBS',
         'rating':5.3,
         'runtime':'50mins',
         'thumb':'/static/img/conan1.jpg'
      },
      {
         'name': 'Conan Late Night',
         'firstAired': '2013-01-02',
         'status':'ended',
         'totalSeasons':3,
         'totalEpisodes':20,
         'nextEpisode':'2013-01-02',
         'network':'CBS',
         'rating':5.3,
         'runtime':'50mins',
         'thumb':'/static/img/conan2.jpg'
      },
      {
         'name': 'Strange series',
         'firstAired': '2013-01-02',
         'status':'ended',
         'totalSeasons':3,
         'totalEpisodes':20,
         'nextEpisode':'2013-01-02',
         'network':'CBS',
         'rating':5.3,
         'thumb':'/static/img/conan3.jpg'
      }
   ];
    
}]);