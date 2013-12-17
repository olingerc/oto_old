/**********************
 *
 *
 * Stack controller
 *
 *
 *******************/
'use strict';

function StackController($scope, $http, $filter) {
   $scope.hoveredStack = {};
   $scope.stackActionError = false;
   $scope.stackActionErrorMsg = '';

   $scope.startAddStack = function() {
      $scope.addStackInput = '';
      $scope.isVisibleStackAdd = true;
   };
   $scope.startRenameStack = function(stack, $event) {
      $scope.renameStackInput = '';
      $scope.isVisibleStackAdd = false;
      $scope.isVisibleStackRename = true;
      $scope.isVisibleStackDelete = false;
      $scope.stackToRename = stack;

      $event.stopPropagation();
   };
   $scope.startDeleteStack = function(stack, $event) {
      $scope.isVisibleStackAdd = false;
      $scope.isVisibleStackRename = false;
      $scope.isVisibleStackDelete = true;
      $scope.stackToDelete = stack;

      $event.stopPropagation();
   };

   $scope.addStack = function() {
      if (!$scope.addStackForm.$valid) {
         return;
      }
      var newStack = {
         'title' : $scope.addStackInput
      };
      $http.post('/stacks/', newStack)
      .success(function(data) {
         $scope.stacks.push(data);
         //stacks inherited
         $scope.isVisibleStackAdd = false;
         $scope.stackSizes[data.id] = 0;
      })
      .error(function(response) {
         if (response.error.search('not unique') > 0) {
            $scope.stackActionError = true;
            $scope.stackActionErrorMsg = 'Stack with that title already exists';
         }
      });
   };

   $scope.renameStack = function() {
      if (!$scope.renameStackForm.$valid) {
         return;
      }

      var title = $scope.renameStackInput;
      $http.put('/stacks/' + $scope.stackToRename.id, {
         'title' : title
      })
      .success(function(newstack) {
         $scope.stacks[$scope.stacks.indexOf($scope.stackToRename)] = newstack;
         //stacks inherited
         $scope.isVisibleStackRename = false;
      })
      .error(function(response) {
         if (response.error.search('not unique') > 0) {
            $scope.stackActionError = true;
            $scope.stackActionErrorMsg = 'Stack with that title already exists';
         }
      });
   };

   $scope.deleteStack = function() {
      //First archive cards in stack
      var cardsInStack = $filter('filter')($scope.cards, {stackid:$scope.stackToDelete.id});
      jQuery.each(cardsInStack, function(i, card) {
         $http.put('/cards/' + card.id, {
            'archivedat' : new Date().toString(),
            'stacktitleafterarchived' : $scope.stackToDelete.title
         })
         .success(function(updatedCard) {
            var filtered = $filter('filter')($scope.cards, {id : updatedCard.id});
            $scope.cards[$scope.cards.indexOf(filtered[0])] = angular.copy(updatedCard);
         })
         .error(function(error) {
            console.log(error);
         });
      });
      $http.delete ('/stacks/' + $scope.stackToDelete.id)
      .success(function() {
         $scope.stacks.splice($scope.stacks.indexOf($scope.stackToDelete), 1);
         //stacks inherited
         $scope.isVisibleStackDelete = false;
      })
      .error(function(error) {
         console.log(error);
      });
   };
}

