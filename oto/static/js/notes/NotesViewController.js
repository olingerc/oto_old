'use strict';

app.controller('NotesViewController', ['$scope', '$rootScope', 'Stacks', 'Cards', function($scope, $rootScope, Stacks, Cards) {
   /********************
    *
    * parent scope variables
    *
    ******************/

   $scope.activestack = {
      'title':'',
      'id':''
   };

   $rootScope.activeCard = null; //TODO: use Cards factory and store active Card there?

   $scope.orderProp = '-modifiedat';
   $scope.setOrder = function(orderProp) {
      $scope.orderProp = orderProp;
   };

   /********************
    *
    * parent scope methods
    *
    ******************/

   $scope.inArchive = function() {
      return $scope.activestack.id === 'archive' ? true : false;
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

   /********************
    *
    * Retrieve data for models
    *
    ******************/

   $scope.stacks = [];
   //TODO: put into factory initialization with watch on username?
   //what about stack add/remove/rename?, avoid stacks on parent scope?
   Stacks.getAll(
      function (allStacks, floatingStack) {
         $scope.stacks = allStacks;
         $scope.floatingStack = floatingStack;
         $scope.search = floatingStack.id; //show only cards of default stack
         $scope.activestack = floatingStack;
      }
   );

   $scope.cards = [];
   Cards.getAll(
      function(cards) {
         $scope.cards = cards;
         //Keep as array of objects. The controller will regroup by sorting when parameters change change
         $scope.cardGroups = [{
            'label': 'unsorted',
            'cards': $scope.cards
         }];
      },
      function(error) {
         console.log(error);
      }
   );


   /******************
    * TODO: card header controller?
    * Buttons not in any sub-controller,
    *************/

   $scope.startAddCard = function() {
      if ($scope.inArchive()) {
         return;
      }
      $scope.$broadcast('startAddCard');
   };

   //Active Card actions
   $scope.startEditCard = function(card) {
      $scope.$broadcast('startCardEdit', card);
   };

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

   /*******************
    *
    * Utility Functions
    *
    ********************/
   $scope.isNotNull = function(value) {
      return value == null ? false : true;
   };

   $scope.dropdown = function(element) {
      $(element).dropdown('toggle');
   };

}]);

