'use strict';

angular.module('oto.filters', [])
  .filter('bystackid', function() {
    return function(cards, search, inArchive) {
      if (!search) {
        return cards;
      }
      if (cards) {
         if (inArchive) {
           return cards.filter(function(card) {
             if (card['archivedat']) {
               return true;
             }
           });
         } else {
         return cards.filter(function(card) {
           if (card['stackid'] === search) {
             return true;
           }
         });
      }
      }
    };
  })
  .filter('handlearchive', function() {
    return function(cards, inArchive) {
      if (cards) {
        if (inArchive) {
         return cards; //bystackid filter will do it
        } else {
           return cards.filter(function(card) {
             if (!card.hasOwnProperty('archivedat')) {
                return true;
             }
             if (!card['archivedat']) {
               return true;
             }
           });
        }
      }
    };
  });

app.directive('xngFocus', function() { //TODO: put into directives file
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
             
         //defineSortElement(scope.orderProp);
         function defineSortElement(orderProp) {
            console.log(scope.sortLabels)
            if (orderProp == 'title') {
               sortLabel = scope.card.title;
               sortLabelShort = sortLabel.substring(0,1).toUpperCase();
            } else {
               var dateType = orderProp.replace('-','');
               sortLabel = scope.card[dateType];
               sortLabelShort = sortLabel;
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

