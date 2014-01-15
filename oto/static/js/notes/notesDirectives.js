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