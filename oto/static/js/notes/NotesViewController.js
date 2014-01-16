'use strict';

app.controller('NotesViewController', ['$scope', '$modal', 'Stacks', 'Cards', 'thumbService', function($scope, $modal, Stacks, Cards, thumbService) {
   /********************
    *
    * parent scope variables
    *
    ******************/

   $scope.activestack = {
      'title':'',
      'id':''
   };

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
   //TODO: put into stacks factory  and avoid stacks on parent scope? by using service in other controllers
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
   //TODO: put into factory initialization?
   //what about stack add/remove/rename?, avoid stacks on parent scope? by using service in other controllers
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
         //Keep as array of objects. The controller will regroup by sorting when parameters change
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
    *
    * Cards Header
    *
    *************/

   $scope.activeCard = Cards.activeCard;
   $scope.processingCard = false; //to enable/disable edit button
   $scope.$watch('activeCard.value', function(value) {
      if (value) {
         if (thumbService.areAttsPending(value.id) || value.saving) {
            $scope.processingCard = true;
         } else {
            $scope.processingCard = false;
         }
      }
   }, true);

   $scope.startAddCard = function() {
      if ($scope.inArchive()) {
         return; //safeguard
      }
      var modalInstance = $modal.open({
         templateUrl: '/static/partials/cardFormModal.html',
         controller: 'CardFormModalInstanceCtrl',
         scope: $scope,
         resolve: {
            CardToEdit:function() {
               return null;
            }
         }
      });
   };

   //Active Card actions
   $scope.startEditCard = function(card) {
      if ($scope.inArchive()) {
         return; //safeguard
      }
      var modalInstance = $modal.open({
         templateUrl: '/static/partials/cardFormModal.html',
         controller: 'CardFormModalInstanceCtrl',
         scope: $scope,
         resolve: {
            CardToEdit:function() {
               return card;
            }
         }
      });
   };

   $scope.removeCard = function(card) {
      Cards.setActiveCard(null);
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

  $scope.openDetails = function (card) {
    var modalInstance = $modal.open({
      templateUrl: '/static/partials/cardDetailsModal.html',
      controller: CardDetailsModalInstanceCtrl,
      resolve: {
        card: function () {
          return card;
        }
      }
    });
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


/**************
 *
 * CARD DETAILS MODAL
 *
 ***************/
var CardDetailsModalInstanceCtrl = function ($scope, $modalInstance, card) {
  $scope.card = card;

  $scope.ok = function () {
    $modalInstance.close();
  };

};
