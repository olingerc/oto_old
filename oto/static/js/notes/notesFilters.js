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
      if (!_us.thumbs[cardid][position]) _us.thumbs[cardid][position] = {};
      _us.thumbs[cardid][position] = {
         'progress':'done',
         'id':attid
      };
   };
   
   _us.changeStatus = function(cardid, progress, position) {
      if (!_us.thumbs[cardid]) _us.thumbs[cardid] = [];
      if (!_us.thumbs[cardid][position]) _us.thumbs[cardid][position] = {};
      _us.thumbs[cardid][position].progress = progress;
   };

   _us.getUrl = function(cardid, position, forDownload) {
      if (!_us.thumbs[cardid]) {
         //TODO: luach thumbnail creation here if not existst?
          return "/static/img/error.jpg";
      } else {
         if (_us.thumbs[cardid][position].progress ==='init') {
            //Before upload has started
            return '/static/img/att_default_thumb.png';
         } 
         else if (_us.thumbs[cardid][position].progress ==='thumb') {
            //creating thumb
            return '/static/img/indicator.gif';
         }
         else if (_us.thumbs[cardid][position].progress ==='done') {
            //OK
            if (forDownload) return '/download/' + _us.thumbs[cardid][position].id; 
            else return '/thumbnail/' + _us.thumbs[cardid][position].id;
         }
         else if (_us.thumbs[cardid][position].progress ==='error') {
            //upload and thumb finished
            return '/static/img/error.jpg';
         }
         else {
            //uploading
            return '/static/img/indicator.gif';
         }
      }
   };
}]);

