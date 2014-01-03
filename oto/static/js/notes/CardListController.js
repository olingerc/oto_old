'use strict';

app.controller('CardListController', ['$scope', '$rootScope', 'Cards', function($scope, $rootScope, Cards) {
   $scope.selectCard = function(card) {
      /*TODO: if edit form visible, load card*/
     //TODO store active card in factory to avoid all this parenting shit
      if ($rootScope.activeCard == card) {
         $rootScope.activeCard = null;
      } else {
         $rootScope.activeCard = card;
      }
   };

   //css for active card
   $scope.cardIsActive = function(card) {
      return card == $rootScope.activeCard ? true : false;
   };

   $scope.$on('unselectCard', function() {
      $rootScope.activeCard = null;
   });

   $scope.startEditCard = function(card) {
      if ($scope.inArchive()) {
         return;
      }
      $rootScope.activeCard = card;
      $rootScope.$broadcast('startCardEdit', card);
   };

}]);