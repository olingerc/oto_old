'use strict';

app.controller('CardListController', ['$scope', '$rootScope', '$filter', 'Cards', function($scope, $rootScope, $filter, Cards) {
   $scope.selectCard = function(card) {
      /*TODO: if edit form visible, load card on select*/
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


   /**********
   *Sort groups //TODO: put into attribute directive for cardlist???
   ***********/

   $scope.$watch('cards', function() {
      getCardGroups();
   }, true);

   $scope.$watchCollection('[orderProp,activestack.title,query]', function() {
      getCardGroups();
   });

   function getCardGroups() {
      var  groupsObj = {},
           label;

      //Handle filtering
      var visibleCards = $scope.cards;
      visibleCards = $filter('handlearchive')(visibleCards, $scope.inArchive());
      visibleCards = $filter('bystackid')(visibleCards, $scope.search, $scope.inArchive());
      visibleCards = $filter('filter')(visibleCards, $scope.query); //The are the ones we watch

      angular.forEach(visibleCards, function(card) {
         if ($scope.orderProp === 'title') {
            label = card.title.substring(0,1).toUpperCase();
         } else {
            label = getDateNoTime(card[$scope.orderProp.replace('-','')]);
         }

         if (!groupsObj[label]) {
            groupsObj[label] = [card];
         } else {
            groupsObj[label].push(card);
         }
      });

      $scope.cardGroups = [];
      angular.forEach(groupsObj, function(cards, label) {
         $scope.cardGroups.push({
            'label':label,
            'cards':cards
         });
      });
      if ($scope.orderProp === 'title') {
         $scope.cardGroups  = $filter('orderBy')($scope.cardGroups, 'label');
      } else {
         $scope.cardGroups  = $filter('orderBy')($scope.cardGroups, '-label'); 
      }
   }

}]);