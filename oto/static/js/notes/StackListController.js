/**********************
 *
 * Stack list controller
 *
 *******************/
'use strict';

app.controller('StackListController', ['$scope', '$http', '$filter', 'Stacks', function ($scope, $http, $filter, Stacks) {
   $scope.hoveredStack = {};
   $scope.stackActionError = false;
   $scope.stackActionErrorMsg = '';

   $scope.$watch('cards', function() {
      //Update badges for stack sizes
      jQuery.each($scope.stacks, function(i, stack) {
         var count = 0;
         jQuery.each($scope.cards, function(i, card) {
            if (card.stackid === stack.id && !card.archivedat) {
               count++;
            }
         });
         $scope.stackSizes[stack.id] = count;
         //TODO: optimize this?
      });
   }, true);

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
      Stacks.add(
         newStack,
         function(stack) {
            $scope.stacks.push(stack);
            $scope.isVisibleStackAdd = false;
            $scope.stackSizes[stack.id] = 0;
         },
         function(response) {
            if (response.error.search('not unique') > 0) {
               $scope.stackActionError = true;
               $scope.stackActionErrorMsg = 'Stack with that title already exists';
            }
         }
      );
   };

   $scope.renameStack = function() {
      if (!$scope.renameStackForm.$valid) {
         return;
      }

      Stacks.rename(
         $scope.stackToRename.id,
         $scope.renameStackInput,
         function(newstack) {
            $scope.stacks[$scope.stacks.indexOf($scope.stackToRename)] = newstack;
            $scope.isVisibleStackRename = false;
         },
         function(response) {
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
         $scope.isVisibleStackDelete = false;
      })
      .error(function(error) {
         console.log(error);
      });
   };
}]);

