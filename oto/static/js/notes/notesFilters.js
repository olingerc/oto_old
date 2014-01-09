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

app.service('uploadService', [function() {//TODO: rename to thumbnail service
   var _us = this;
   _us.status = 'idle';
   _us.thumbs = {};
   _us.pending = 0;

   _us.storeThumbnail = function(cardid, attid, position) {
      if (!_us.thumbs[cardid]) _us.thumbs[cardid] = [];
      _us.thumbs[cardid][position] = {
         'url': '/thumbnail/' + attid,
         'progress':'done',
         'id':attid
      };
      //console.log(_us.thumbs)
   };

   _us.getUrl = function(cardid, attid, position) {
      if (!_us.thumbs[cardid]) {
         //TODO: luach thumbnail creation here if not existst?
          return "/static/images/error.jpg";
      } else {
         if (attid != _us.thumbs[cardid][position].id && _us.thumbs[cardid][position].progress ==='done') { //In the case the thumb was just created and not yet rececied in the cards array from the server
            //We are probably uploading and server has not yet returned an id
            console.log(attid)
            _us.thumbs[cardid][position].url = "/thumbnail/" + _us.thumbs[cardid][position].id;
         }
         return _us.thumbs[cardid][position].url;
      }
   };
}]);

