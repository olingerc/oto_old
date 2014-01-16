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

app.directive('myIfBrowserFeature', function() {

  return {
    template: '<div ng-if="hasFeatures"><div ng-transclude></div></div>',
    transclude: true,
    scope: true,
    link: function($scope, $element, $attrs) {

      $scope.hasFeatures = true;

      var features = ($attrs.myIfBrowserFeature || "").split(' ');

      var fl = features.length;

      while(fl && $scope.hasFeatures) {
        var f = features[--fl];

        if(f.length === 0) { continue; }

        var cmp = f.charAt(0) === '!' ? false : true;

        if(cmp === false) { f = f.substr(1); }

        var p = Modernizr;
        var q = f.split('.');

        while(q.length && p !== undefined) {
          p = p[q.shift()];
        }

        $scope.hasFeatures = (!p) == (!cmp);
      }
    }
  };
});
