'use strict';

app.controller('CardListController', ['$scope', '$rootScope', 'Cards', function($scope, $rootScope, Cards) {
   $scope.selectCard = function(card) {
      /*TODO: if edit form visible, load card*/
      if ($scope.$parent.activeCard == card) {
         $scope.$parent.activeCard = null;
      } else {
         $scope.$parent.activeCard = card;
      }
   };

   //css for active card
   $scope.cardIsActive = function(card) {
      return card == $scope.$parent.activeCard ? true : false;
   };

   $scope.$on('unselectCard', function() {
      $scope.$parent.activeCard = null;
   });


   $scope.startEditCard = function(card) {
      if ($scope.inArchive()) {
         return;
      }
      $scope.$parent.activeCard = card;
      $rootScope.$broadcast('startCardEdit', card);
   };

}]);