app.directive('xngFocus', function() {
    return function(scope, element, attrs) {
       scope.$watch(attrs.xngFocus,
         function (newValue) {
            if (newValue) {
               window.setTimeout(function() {
                  newValue && element.focus();
               },0);
            }
         },true);
      };
});

app.directive('thumbProgress', [function() {
    return {
        restrict: 'E',
        replace: true,
        template: '<img class="att_thumb img-rounded" src="/static/img/indicator.gif" class="att.id">',
        scope: {
           showprogress:'=showprogress'
        },
        link: function($scope, element, attrs) {
            $scope.$watch('showprogress', function(showprogress) {
                  if (showprogress) {
                     //TODO: show porgress
                  } else {
                     element.hide();
                  }
            });

            $scope.$on("$destroy",
                  function() {
                      console.log('destroy');
                  }
              );
        }
    };
}]);