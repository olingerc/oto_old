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

app.factory('sortLabelsService', function(){
   var sortLabels = [],
      sortLabel,
      sortLabelShort,
      onPage = {},
      placed = 0;

   var getSortLabelShort = function (card, orderProp) {
         if (orderProp == 'title') {
            sortLabel = card.title;
            sortLabelShort = sortLabel.substring(0,1).toUpperCase();
         } else {
            var dateType = orderProp.replace('-','');
            sortLabel = card[dateType];
            sortLabelShort = getDateNoTime(sortLabel);
         }
         return sortLabelShort;
      };

   return {
      sortLabels : sortLabels,
      placed: function() {return placed;},
      addLabel: function(label,$index, elem) {
         if (!onPage[label]) {
            onPage[label] = [{
               'index':$index,
               'elem':elem
            }];
         } else {
            onPage[label].push({
               'index':$index,
               'elem':elem
            });
         }
         placed++;
      },
      onPage:onPage,
      showHide: function() {
         console.log('showHide')
         var min;
         angular.forEach(onPage, function(group, key) {
            var minLi = 9999;
            var minp = 9999;
            angular.forEach(group, function(label, pos) {
               label.elem.css({
                  'color':'black'
               });
               if (label.index < minLi) {
                  minLi = label.index;
                  minp = pos;
               }
            });
            group[minp].elem.css({
               'color':'red'
            });
         });
      },
      refreshLabels: function(cards, orderProp) {
         sortLabels = {};
         placed = 0;
         onPage = {};
         console.log('refresh'); //TODO: 2 refreshes on stack change
         angular.forEach(cards, function(card, key) {
            sortLabels[card.id] = {
               'label': getSortLabelShort(card, orderProp)
            };
         });
         console.log(cards)
         console.log(Object.keys(sortLabels).length)
      }
   };
});


app.directive('sortLabel', ['sortLabelsService' , function (sortLabelsService) {
    return {
      restrict: 'E',
      template: '<p class="text-muted" >{{sortLabelShort}}</p>',//ng-show="showSortLabel[$index]"
      replace:true,
      link: function (scope, elem, attrs) {
         /*scope.$watch('orderProp',
            function() {
               if (sortLabelsService.sortLabels[scope.card.id]) {
                  scope.sortLabelShort = sortLabelsService.sortLabels[scope.card.id].label;
                  sortLabelsService.addLabel(scope.sortLabelShort, scope.key, elem);
               }

               if(scope.filteredCards.length == sortLabelsService.placed()) {
                  sortLabelsService.showHide();
               }
            }
         );*/
         /*scope.$watch('activestack.title',
            function() {
               if (sortLabelsService.sortLabels[scope.card.id]) {
                  scope.sortLabelShort = sortLabelsService.sortLabels[scope.card.id].label;
                  sortLabelsService.addLabel(scope.sortLabelShort, scope.key, elem);
               }

               if(scope.filteredCards.length == sortLabelsService.placed()) {
                  sortLabelsService.showHide();
               }
            }
         );*/
      }
    };
}]);