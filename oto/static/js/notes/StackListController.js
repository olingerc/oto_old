'use strict';

app.controller('StackListController', ['$scope', '$rootScope', '$filter', 'Stacks', 'Cards', function ($scope, $rootScope, $filter, Stacks, Cards) {
   $scope.stackActionError = false;
   $scope.stackActionErrorMsg = '';

   //Stack size badges
   $scope.stackSizes = {};
   $scope.$watch('cards', function() {
      jQuery.each($scope.stacks, function(i, stack) {
         var count = 0;
         jQuery.each($scope.cards, function(i, card) {
            if (card.stackid === stack.id && !card.archivedat) {
               count++;
            }
         });
         $scope.stackSizes[stack.id] = count;
         //TODO: optimize the counting?
      });
   }, true);

   //css for active stack
   $scope.stackIsActive = function(stacktitle) {
      return stacktitle == $scope.activestacktitle ? true : false;
   };


   $scope.stackIsEditable = function() {
      if (
            $scope.$parent.activestacktitle == 'Floating' ||
            $scope.$parent.activestacktitle == 'Archive' ||
            $scope.$parent.activestacktitle == 'All'
          ) {
             return true;
          } else {
            return false;
          }
   };

   //stacks actions
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
   };
   $scope.startDeleteStack = function(stack, $event) {
      $scope.isVisibleStackAdd = false;
      $scope.isVisibleStackRename = false;
      $scope.isVisibleStackDelete = true;
      $scope.stackToDelete = stack;
   };

   $scope.addStack = function() {
      Stacks.add(
         $scope.addStackInput,
         function(stack) {
            $scope.stacks.push(stack);
            $scope.isVisibleStackAdd = false;
            $scope.stackSizes[stack.id] = 0; //no need for a $watch on stacks here
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
      Stacks.rename(
         $scope.stackToRename.id,
         $scope.renameStackInput,
         function(renamedStack) {
            $scope.stacks[$scope.stacks.indexOf($scope.stackToRename)] = renamedStack;
            $scope.isVisibleStackRename = false;
            if ($scope.$parent.activestackid == renamedStack.id) {
               $scope.$parent.activestacktitle = renamedStack.title;
            }
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
         Cards.archive(
            card.id,
            $scope.stackToDelete.title,
            function(updatedCard) {
               var filtered = $filter('filter')($scope.cards, {id : updatedCard.id});
               $scope.cards[$scope.cards.indexOf(filtered[0])] = angular.copy(updatedCard);
            },
            function(error) {
               console.log(error);
            }
         );
      });

      Stacks.remove(
         $scope.stackToDelete.id,
         function() {
            $scope.stacks.splice($scope.stacks.indexOf($scope.stackToDelete), 1);
            $scope.isVisibleStackDelete = false;
            if ($scope.$parent.activestackid == $scope.stackToDelete.id) {
               $scope.listStackUser($scope.$parent.floatingStack);
            }
         },
         function(error) {
            console.log(error);
         }
      );
   };

   //Filter cardsview by active stack
   $scope.listStackUser = function(stack) {
      $rootScope.$broadcast('cancelCardForm');
      $rootScope.$broadcast('unselectCard');
      $scope.$parent.search = stack.id;
      $scope.$parent.activestacktitle = stack.title;
      $scope.$parent.activestackid = stack.id;
   };

   $scope.listStackAll = function(stack) {
      $rootScope.$broadcast('cancelCardForm');
      $rootScope.$broadcast('unselectCard');
      $scope.$parent.search = "";
      $scope.$parent.activestacktitle = 'All';
      $scope.$parent.activestackid = '';
   };
   $scope.listStackArchive = function(stack) {
      $rootScope.$broadcast('cancelCardForm');
      $rootScope.$broadcast('unselectCard');
      $scope.$parent.search = "archive";
      $scope.$parent.activestacktitle = 'Archive';
      $scope.$parent.activestackid = 'archive';
   };

}]);

