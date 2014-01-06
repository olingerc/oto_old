app.directive('xngFocus', function() {
    return function(scope, element, attrs) {
       scope.$watch(attrs.xngFocus,
         function (newValue) {
            if (newValue) {
               newValue && element.focus();
            } else {
               //element.blur();
            }
         },true);
      };
});