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

   _us.storeThumbnail = function(clientid, serverid, att) {
      if (att) { //differentiate between ng-init on page load (att has serverid) or new att added by client (att has no serverid)
         if (!att.id) return;
      }
      if (clientid && !serverid) {
         //server starts upload
         _us.thumbs[clientid] = {
            'progress':'init'
         };
      }
      else if (clientid && serverid) {
         //server has finished upload
         _us.thumbs[clientid] = {
            'progress':'done',
            'id':serverid
         };
         _us.thumbs[serverid] = {
            'progress':'done',
            'id':serverid
         };
      }
      else {
         //pageload?
         _us.thumbs[serverid] = {
            'progress':'done',
            'id':serverid
         };
      }
   };

   _us.changeStatus = function(clientid, progress) {
      if (!_us.thumbs[clientid]) _us.thumbs[clientid] = {};
      _us.thumbs[clientid].progress = progress;
   };

   _us.getUrl = function(clientid, serverid, what) {
      if (serverid) {
         var id = serverid; //initial pageload
      } else {
         var id = clientid;
      }

      if (!_us.thumbs[id]) {
         //TODO: launch thumbnail creation here if not existst?
          return "/static/img/error.jpg";
      } else {
         if (_us.thumbs[id].progress ==='init') {
            //Before upload has started
            return '/static/img/att_default_thumb.png';
         }
         else if (_us.thumbs[id].progress ==='thumb') {
            //creating thumb
            return '/static/img/indicator.gif';
         }
         else if (_us.thumbs[id].progress ==='done') {
            //OK
            if (!what) return '/thumbnail/' + _us.thumbs[id].id;
            else if (what === 'download') return '/download/' + _us.thumbs[id].id;
            else if (what === 'id') return _us.thumbs[id].id;
            else return '/thumbnail/' + _us.thumbs[id].id;
         }
         else if (_us.thumbs[id].progress ==='error') {
            //upload and thumb finished
            return '/static/img/error.jpg';
         }
         else {
            //uploading
            return '/static/img/indicator.gif';
         }
      }
   };

   _us.allowDelete = function(clientid, serverid) {
      if (serverid) {
         var id = serverid; //initial pageload
      } else {
         var id = clientid;
      }

      if (!_us.thumbs[id]) {
          return false;
      } else {
         if (_us.thumbs[id].progress ==='init') {
            return false;
         }
         else if (_us.thumbs[id].progress ==='thumb') {
            return false;
         }
         else if (_us.thumbs[id].progress ==='done') {
            return true;
         }
         else if (_us.thumbs[id].progress ==='error') {
            return false;
         }
         else {
            return false;
         }
      }
   };
}]);

