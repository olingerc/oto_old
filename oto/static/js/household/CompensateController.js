app.controller('CompensateController', ['$scope', '$rootScope', function($scope, $rootScope) {
   $rootScope.core.subnavurl = '/static/js/household/subnav.html';

   $scope.compData = [
      {
         month:'03-2013',
         incomeCK:'3000',
         recalcCK:'50',
         noteCK:'First',
         incomeCO:'3000',
         recalcCO:'50',
         noteCO:'Second',
         paidOn:'2014-05-06'
      },
      {
         month:'04-2013',
         incomeCK:'3000',
         recalcCK:'50',
         noteCK:'First',
         incomeCO:'3000',
         recalcCO:'50',
         noteCO:'Second',
         paidOn:'2014-05-06'
      },
      {
         month:'05-2013',
         incomeCK:'3000',
         recalcCK:'50',
         noteCK:'First',
         incomeCO:'3000',
         recalcCO:'50',
         noteCO:'Second',
         paidOn:'2014-05-06'
      }
   ];

   $scope.addRow = function() {
      $scope.compData.push({});
   };

}]);