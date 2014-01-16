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
        template: '<div style="margin-top:30px" class="progress progress-striped">  <div class="progress-bar"  role="progressbar" aria-valuenow="100" style="width: 100%">  </div></div>',
        scope: {
           showprogress:'=showprogress'
        },
        link: function($scope, element, attrs) {
            $scope.$watch('showprogress', function(showprogress) {
                  if (showprogress) {
                     //TODO: show porgress
                     element.addClass('active');
                  } else {
                     element.removeClass('active');
                     element.hide();
                  }
            });

            $scope.$on("$destroy",
                  function() {
                     element.removeClass('active');
                  }
            );
        }
    };
}]);
