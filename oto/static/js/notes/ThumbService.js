app.service('thumbService', [function() {//TODO: rename to thumbnail service
   var _us = this;
   _us.thumbs = {};

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
         else if (_us.thumbs[id].progress ==='done') {
            //OK
            if (!what) return '/thumbnail/' + _us.thumbs[id].id;
            else if (what === 'download') return '/download/' + _us.thumbs[id].id;
            else if (what === 'linkthumb') return '/thumbnaillink/' + _us.thumbs[id].id;
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

   _us.getProgress = function(clientid, serverid) {
      if (serverid) {
         var id = serverid; //initial pageload
      } else {
         var id = clientid;
      }

      if (!_us.thumbs[id]) {
         //TODO: launch thumbnail creation here if not existst?
          return "error";
      } else {
         if (_us.thumbs[id].progress ==='init') {
            //Before upload has started
            return 'init';
         }
         else if (_us.thumbs[id].progress ==='done') {
            //OK
            return '';
         }
         else if (_us.thumbs[id].progress ==='error') {
            //upload and thumb finished
            return 'error';
         }
         else {
            //uploading
            if (_us.thumbs[id].progress === 100) return 'storing';
            return _us.thumbs[id].progress;
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