/*************************
 *
 * Card controller
 *
 *************************/

'use strict';
app.controller('CardController', ['$scope', '$http', function($scope, $http) {
   $scope.removCard = function(cardid, card) {
      if ($scope.inArchive()) {
         $http.delete ('/cards/' + cardid).success(function() {
            $scope.cards.splice($scope.cards.indexOf(card), 1);
            //cards inherited
            $scope.updateStackSizes();
            //function inherited
         });
      } else {
         $http.put('/cards/' + cardid, {
            'archivedat' : new Date().toString(),
            'stacktitleafterarchived' : $scope.getStacktitle(card.stackid)
         }).success(function(updatedCard) {
            //TODO:Strangely attachments only appear in archive after reload
            $scope.cards[$scope.cards.indexOf(card)] = updatedCard;
            //cards inherited
            $scope.updateStackSizes();
            //function inherited
         });
      }
   };

   $scope.moveCard = function(cardid, card, stackid) {
      $http.put('/cards/' + cardid, {
         'stackid' : stackid,
         'archivedat' : null,
         'stacktitleafterarchived' : null
      }).success(function(updatedCard) {
         $scope.cards[$scope.cards.indexOf(card)] = updatedCard;
         $scope.updateStackSizes();
         //function inherited
      });
   };
}]);