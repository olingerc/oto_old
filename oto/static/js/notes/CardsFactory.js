app.factory('Cards', ['$http', function($http) {
   return {
      getAll: function(success, error) {
         $http.get('/cards').success(success).error(error);
      },
      remove: function(cardid, success, error) {
         $http.delete('/cards/' + cardid).success(success).error(error);
      },
      archive: function(cardid, stachtitleafterarchive, success, error) {
         $http.put('/cards/' + cardid, {
            'archivedat' : new Date().toString(),
            'stacktitleafterarchived' : stachtitleafterarchive
         }).success(success).error(error);
      },
      move: function(cardid, stackid, success, error) {
         $http.put('/cards/' + cardid, {
            'stackid' : stackid,
            'archivedat' : null,
            'stacktitleafterarchived' : null
         }).success(success).error(error);
      }
   };
}]);
