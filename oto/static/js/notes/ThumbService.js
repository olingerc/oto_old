app.service('thumbService', [function() {
   var _us = this;
   _us.thumbs = {};
   _us.count = {};

   _us.storeThumbnail = function(cardid, clientid, serverid, att) {
      if (att) { //differentiate between ng-init on page load (att has serverid) or new att added by client (att has no serverid) for cardlist
         if (!att.id) {
            return;
         }
      }
      if (clientid && !serverid) {         //server starts upload
         if (!_us.count[cardid]) {
            _us.count[cardid] = 1;
         } else {
            _us.count[cardid]++;
         }

         _us.thumbs[clientid] = {
            'progress':'init'
         };
      }
      else if (clientid && serverid) {    //server has finished upload and returns with an id
         _us.count[cardid]--;
         _us.thumbs[clientid] = {
            'progress':'done',
            'id':serverid
         };
         _us.thumbs[serverid] = {
            'progress':'done',
            'id':serverid
         };
      }
      else {                               //page load
         _us.thumbs[serverid] = {
            'progress':'done',
            'id':serverid
         };
      }
   };

   _us.areAttsPending = function(cardid) {
      if (!_us.count[cardid]) {
         return false;
      }
      if (_us.count[cardid] === 0) {
         return false;
      } else {
         return true;
      }
   };

   _us.changeStatus = function(clientid, progress) {
      if (!_us.thumbs[clientid]) _us.thumbs[clientid] = {};
      _us.thumbs[clientid].progress = progress;
   };

   _us.getServerId = function(clientid, serverid, prefix) {
      if (serverid) {          //initial pageload
         return prefix + serverid;
      }

      //Either serverid is stored in thumbs[clientid].id after successfull upload or not yet
      if (!_us.thumbs[clientid]) {
          return null;
      } else {
         if (_us.thumbs[clientid].progress ==='done') {
            return prefix + _us.thumbs[clientid].id;
         } else {
            //uploading
            return null;
         }
      }
   };

   _us.getProgress = function(clientid, serverid) {
      if (serverid) {
         return '';
      }

      if (!_us.thumbs[clientid]) {
          return "error";
      } else {
         if (_us.thumbs[clientid].progress ==='init') {
            //Before upload has started
            return 'queued';
         }
         else if (_us.thumbs[clientid].progress ==='done') {
            //OK
            return '';
         }
         else if (_us.thumbs[clientid].progress ==='error') {
            //upload and thumb finished
            return 'error';
         }
         else {
            //uploading
            if (_us.thumbs[clientid].progress === 100) return 'storing';
            return _us.thumbs[clientid].progress;
         }
      }
   };

   _us.allowDelete = function(clientid, serverid) {
      if (serverid) {
         return true;
      }

      if (!_us.thumbs[clientid]) {
          return false;
      } else {
         if (_us.thumbs[clientid].progress ==='done') {
            return true;
         } else {
            return false;
         }
      }
   };
}]);