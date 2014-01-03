'use strict';

app.controller('CardListController', ['$scope', '$rootScope', 'Cards', function($scope, $rootScope, Cards) {
   $scope.selectCard = function(card) {
      /*TODO: if edit form visible, load card*/
     //TODO store active card in factory to avoid all this parenting shit
      if ($scope.$parent.$parent.activeCard == card) {
         $scope.$parent.$parent.activeCard = null;
      } else {
         $scope.$parent.$parent.activeCard = card;
      }
   };

   //css for active card
   $scope.cardIsActive = function(card) {
      return card == $scope.$parent.$parent.activeCard ? true : false;
   };

   $scope.$on('unselectCard', function() {
      $scope.$parent.$parent.activeCard = null;
   });


   $scope.startEditCard = function(card) {
      if ($scope.inArchive()) {
         return;
      }
      $scope.$parent.$parent.activeCard = card;
      $rootScope.$broadcast('startCardEdit', card);
   };

}]);