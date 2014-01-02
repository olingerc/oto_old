'use strict';

app.controller('NotesViewController', ['$scope', 'Stacks', 'Cards', function($scope, Stacks, Cards) {
   /********************
    *
    * parent scope variables
    *
    ******************/

   var orderPropVerbose = {
      '-modifiedat' : 'Last modified',
      '-createdat' : 'Last created',
      'title' : 'Title'
   };

   $scope.activestacktitle = "Floating";
   $scope.activestackid = "";
   
   $scope.orderProp = '-modifiedat';
   $scope.orderPropVerbose = 'Last modified';
   $scope.setOrder = function(orderProp) {
      $scope.orderProp = orderProp;
      $scope.orderPropVerbose = orderPropVerbose[orderProp];
   };
   
   /********************
    *
    * parent scope methods
    *
    ******************/
   
   $scope.inArchive = function() {
      return $scope.activestackid === 'archive' ? true : false;
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
      }
   );

   $scope.cards = [];
   Cards.getAll(
      function(cards) {
         $scope.cards = cards;
      },
      function(error) {
         console.log(error);
      }
   );

   /******************
    *
    * Buttons not in any sub-controller
    *
    *************/

   $scope.startAddCard = function() {
      if ($scope.inArchive()) {
         return;
      }
      $scope.$broadcast('startAddCard');
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

