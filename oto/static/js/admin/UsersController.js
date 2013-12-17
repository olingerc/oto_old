'use strict';

function UsersController ($scope, $http, $resource) {
   $scope.users = {};
   $scope.master = {};
   $scope.user = {};
   $scope.userFormState = {
      action: 'add',
      loadedIndex: null,
      errorAlreadyExists: false
   };

   $http({
      method:'GET',
      url:'/users'
   })
   .success(function(data) {
      angular.forEach(data, function(value, key) {
         value.password = null;
      });
      $scope.users = data;
   });

   $scope.update = function(user) {
      $scope.master = angular.copy(user);
   };

   $scope.isUnchanged = function(user) {
      return angular.equals(user, $scope.master);
   };

   $scope.userFormAction = function(user) {
      if ($scope.userFormState.action === 'add') {
         $scope.addUser(user);
      } else {
         $scope.confirmUpdate();
      }
   };

   $scope.addUser = function(user) {
      $http({
         method:'POST',
         url:'/users',
         data:user
      })
      .success(function(data) {
         $scope.users.push(data);
         $scope.resetForm();
      }).
      error(function(response) {
         if (response.error.search('E11000 duplicate key error') > 0) {
            $scope.userFormState.errorAlreadyExists = true;
         }
      });
   };

   $scope.updateUser = function(index) {
      $scope.userFormState.action = 'save';
      $scope.user  = angular.copy($scope.users[index]);
      $scope.master = angular.copy($scope.user);
      $scope.userFormState.loadedIndex = index;
   };

   $scope.confirmUpdate = function() {
      $http({
         method:'PUT',
         url:'/users/' + $scope.user.id,
         data:$scope.user
      })
      .success(function(data) {
         $scope.users[$scope.userFormState.loadedIndex] = $scope.user;
         $scope.resetForm();
      }).
      error(function(response) {
         if (response.error.search('E11000 duplicate key error') > 0) {
            $scope.userFormState.errorAlreadyExists = true;
         }
      });
   };

   $scope.resetForm = function(index) {
      $scope.user = {};
      $scope.userFormState = {
         action: 'add',
         loadedIndex: null,
         errorAlreadyExists: false
      };
   };

   $scope.deleteUser = function(index) {
      //http://stackoverflow.com/questions/14250642/angularjs-how-to-remove-an-item-from-scope
      var User = $resource('/users/:userId', {userId:'@id'});
      var user_to_delete = $scope.users[index];
      User.delete({ userId: user_to_delete.id }, function (success) {
         $scope.users.splice(index, 1);
      });
   };
}
