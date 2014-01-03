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

         defineSortElement(scope.orderProp);
         function defineSortElement(orderProp) {
            if (orderProp == 'title') {
               sortLabel = scope.card.title;
               sortLabelShort = sortLabel.substring(0,1).toUpperCase();
            } else {
               var dateType = orderProp.replace('-','');
               sortLabel = scope.card[dateType];
               sortLabelShort = getDateNoTime(sortLabel);
            }
            //Show? It seems that the visible order is not the same than the array order. this causes
            // The 3rd of 3 elemnts to be visible but the 'previous' 2 have not been evaluated yet
            //Thats why I use $index and lowest
            if (scope.sortLabels[sortLabelShort]) {
               if (scope.$index < scope.lowestSortLabel[sortLabelShort]) {
                  //hide previous, show this
                  scope.showSortLabel[scope.lowestSortLabel[sortLabelShort]] = false;
                  scope.showSortLabel[scope.$index] = true;
                  
                  //store lowest
                  scope.lowestSortLabel[sortLabelShort] = scope.$index;
               }
               elem.html(sortLabelShort);
            } else {
               elem.html(sortLabelShort);
               scope.sortLabels[sortLabelShort] = scope.$index;
               scope.lowestSortLabel[sortLabelShort] = scope.$index;
               scope.showSortLabel[scope.$index] = true;
            }
         }

         scope.$watch('orderProp', function(orderProp) {
            defineSortElement(orderProp);
         });
         scope.$watch('activestack', function() {
            defineSortElement(scope.orderProp);
         });
      }
    };
});