'use strict';

app.controller('CardListController', ['$scope', '$rootScope', '$filter', 'Cards', 'thumbService', function($scope, $rootScope, $filter, Cards, thumbService) {
   $scope.selectCard = function(card) {
      /*TODO: if edit form visible, load card on select*/
     //TODO store active card in factory to avoid all this parenting shit
      if ($rootScope.notes.activeCard == card) {
         $rootScope.notes.activeCard = null;
      } else {
         $rootScope.notes.activeCard = card;
      }
   };

   //css for active card
   $scope.cardIsActive = function(card) {
      return card == $rootScope.notes.activeCard ? true : false;
   };

   $scope.$on('unselectCard', function() {
      $rootScope.notes.activeCard = null;
   });

   $scope.startEditCard = function(card) {
      if ($scope.inArchive()) {
         return;
      }
      $rootScope.notes.activeCard = card;
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

   $scope.thumbService = thumbService; //only for view, don't use $scope.thumbService to update, but thumbService


}]);