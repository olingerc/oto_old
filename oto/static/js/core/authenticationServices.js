'use strict';

app.factory('Auth', function($rootScope, $http, $cookieStore){
    var accessLevels = routingConfig.accessLevels,
        userRoles = routingConfig.userRoles,
        currentUser = JSON.parse($cookieStore.get('user').replace('|',',')) || { username: '', role: userRoles.public };

    function changeUser(user) {
        _.extend(currentUser, user);
        /*
         * angular.extend(dst, src);
         * Extends the destination object dst by copying all of the properties from the src object(s) to dst. You can specify multiple src objects.
         */
    };

    return {
        authorize: function(accessLevel, role) {
            if(typeof(currentUser.role) === 'string') {
               currentUser.role = userRoles[currentUser.role];
            }
            if(role === undefined) {
                role = currentUser.role;
               if(typeof(role) === 'string') {
                  role = userRoles[role];
               }
             }
            return accessLevel.bitMask & role.bitMask;
        },
        isLoggedIn: function(user) {
            if(user === undefined) {
                user = currentUser;
             }
            if(typeof(currentUser.role) === 'string') {
               currentUser.role = userRoles[currentUser.role];
            }
            if(typeof(user.role) === 'string') {
               user.role = userRoles[user.role];
            }
            return user.role.title == userRoles.user.title || user.role.title == userRoles.admin.title;
        },
        login: function(user, success, error) {
            $http.post('/checklogin', user).success(function(user){
               user.role = userRoles[user.role];
               changeUser(user);
               success(user);
            }).error(error);
        },
        logout: function(success, error) {
            $http.post('/logout').success(function(){
                changeUser({
                    username: '',
                    role: userRoles.public
                });
                success();
                $rootScope.savedLocation = null;
            }).error(error);
        },
        accessLevels: accessLevels,
        userRoles: userRoles,
        user: currentUser
    };
});

/*
app.factory('$ServerLogin', function($http){
  return function(){
     var userRoles = routingConfig.userRoles;
     $http.get('/_usersession')
     .success(function(user){
           user.role = userRoles[user.role];
           return user;
      })
      .error();
  };
});
*/