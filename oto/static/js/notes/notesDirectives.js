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
        template: '<div style="margin-top:30px;min-width:50px" class="progress progress-striped">  <div class="progress-bar"  role="progressbar" aria-valuenow="100" style="width: 100%">  </div></div>',
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

/*Heavily inspired by angularui utils*/
app.directive('otoReset', function() {
    return {
       restrict:'A',
       require:'ngModel',
       scope:{
          ngShow:'='
       },
       link: function(scope, element, attrs, ctrl) {
            var aElement,wElement;
            wElement = angular.element('<span class="ui-resetwrap" />');
            aElement = angular.element('<a class="ui-reset"><i class="glyphicon  glyphicon-remove-circle"></i></a>');
            element.wrap(wElement).after(aElement);

            if (attrs.ngShow) {
               scope.$watch('ngShow', function(show) {
                  if (show) {
                     element.parent().show();
                  } else {
                     element.parent().hide();
                  }
               });
            }

            aElement.bind('click', function (e) {
              e.preventDefault();
              scope.$apply(function () {
                  ctrl.$setViewValue('');
                  ctrl.$render();
              });
            });
         }
       };
});