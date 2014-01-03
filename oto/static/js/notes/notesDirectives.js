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


app.directive('sortLabel', function () {
    return {
      restrict: 'A',
      link: function (scope, elem, attrs) {
         var sortLabel,
             sortLabelShort;
             
         function defineSortElement(orderProp) {
            if (orderProp == 'title') {
               sortLabel = scope.card.title;
               sortLabelShort = sortLabel.substring(0,1).toUpperCase();
            } else {
               var dateType = orderProp.replace('-','');
               sortLabel = scope.card[dateType];
               sortLabelShort = getDateNoTime(sortLabel);
            }

            //Show?
            if (scope.sortLabels.indexOf(sortLabelShort) > -1) {
               elem.hide();
            } else {
               elem.html(sortLabelShort);
               scope.sortLabels.push(sortLabelShort);
            }            
         }

         scope.$watch('orderProp', function(orderProp) {
            defineSortElement(orderProp);
         });
      }
    };
});