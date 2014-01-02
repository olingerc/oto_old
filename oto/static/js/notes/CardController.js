'use strict';

app.controller('CardController', ['$scope', '$rootScope', 'Cards', function($scope, $rootScope, Cards) {
   
   //Card actions
   $scope.removeCard = function(card) {
      if ($scope.inArchive()) {
         Cards.remove(
            card.id,
            function() {
               $scope.cards.splice($scope.cards.indexOf(card), 1);
            },
            function(error) {
               console.log(error);
            }
         );
      } else {
         Cards.archive(
            card.id,
            $scope.getStacktitle(card.stackid),
            function(updatedCard) {
               $scope.cards[$scope.cards.indexOf(card)] = updatedCard;
            },
            function(error) {
               console.log(error);
            }
         );
      }
   };

   $scope.moveCard = function(card, stackid) {
      Cards.move(
         card.id,
         stackid,
         function(updatedCard) {
            $scope.cards[$scope.cards.indexOf(card)] = updatedCard;
         },
         function(error) {
            console.log(error);
         }
      );
   };
   
   $scope.startEditCard = function(card) {
      if ($scope.inArchive()) {
         return;
      }
      $rootScope.$broadcast('startCardEdit', card);
   };

   //Stacktitle by stackid. In the card I only store id
   //TODO: put into stacks factory  and avoid stacks on parent scope?
   $scope.getStacktitle = function(stackid) {
      var stack = $scope.stacks.filter(function(stack) {
         if (stack['id'] === stackid) {
            return stack;
         }
      });
      if (stack.length === 1) {
         return stack[0].title;
      } else {
         return 'Floating';
      }
   };
}]);