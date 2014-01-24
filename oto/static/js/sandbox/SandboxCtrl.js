'use strict';
app.controller('SandboxCtrl', ['$scope', function ($scope) {
   $scope.content = 'Init';

   var ws = new WebSocket("ws://localhost:5000/wsapi");
   ws.onmessage = function(evt){
      var received_msg = evt.data;
      $scope.content = received_msg;
      $scope.$apply();
   };

   $scope.sendMessage = function() {
      ws.send($scope.input);
   };
}]);
