'use strict';

app.controller('NotesViewController', ['$scope', '$http', '$filter', '$upload', 'Stacks', function($scope, $http, $filter, $upload, Stacks) {

   /********************
    *
    * parent scope variables and model initialization
    *
    ******************/

   var orderPropVerbose = {
      '-modifiedat' : 'Last modified',
      '-createdat' : 'Last created',
      'title' : 'Title'
   };

   $scope.stacks = [];
   $scope.cards = [];

   $scope.stackSizes = {};
   $scope.activestacktitle = "Floating";
   $scope.activestackid = "";


   /********************
    *
    * Retrieve models
    *
    ******************/
   Stacks.getAll(function (allStacks, floatingStack) {
      $scope.stacks = allStacks;
      $scope.floatingStack = floatingStack;
   });

   $http.get('/cards/') //TODO: cards factory
   .success(function(response) {
      $scope.cards = response;
   })
   .error(function(error) {
      console.log(error);
   });

   //Utility Functions
   $scope.isNotNull = function(value) {
      return value == null ? false : true;
   };
   $scope.dropdown = function(element) {
      $(element).dropdown('toggle');
   };

   /******************
    *
    * Stack operations and display necessary outside Stack Controller
    *
    *************/

   $scope.stackIsActive = function(stacktitle) {
      return stacktitle == $scope.activestacktitle ? true : false;
   };

   //Filter by stack
   $scope.listStackUser = function(stack) {
      $scope.cancelCardForm();
      $scope.search = stack.id;
      $scope.activestacktitle = stack.title;
      $scope.activestackid = stack.id;
   };
   $scope.listStackAll = function(stack) {
      $scope.cancelCardForm();
      $scope.search = "";
      $scope.activestacktitle = 'All';
      $scope.activestackid = '';
   };
   $scope.listStackArchive = function(stack) {
      $scope.cancelCardForm();
      $scope.search = "archive";
      $scope.activestacktitle = 'Archive';
      $scope.activestackid = 'archive';
   };

   //Stacktitle by stackid. In the card I only store id
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

   //Are we in archive?
   $scope.inArchive = function() {
      return $scope.activestackid === 'archive' ? true : false;
   };

   $scope.startAddCard = function() {
      if ($scope.inArchive()) {
         return;
      }
      $scope.$broadcast('startAddCard');
   };

   //TODO: put into cardlist controller
   $scope.loadCardIntoForm = function(card) {
      if ($scope.inArchive()) {
         return;
      }
      $scope.$broadcast('startCardEdit', card);
   };


   /*
   *
   * Cards controls outside of card controller
   *
   */

   //Sorting
   $scope.orderProp = '-modifiedat';
   $scope.orderPropVerbose = 'Last modified';

   $scope.setOrder = function(orderProp) {
      $scope.orderProp = orderProp;
      $scope.orderPropVerbose = orderPropVerbose[orderProp];
   };

}]);

