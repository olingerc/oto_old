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

app.service('uploadService', ['$http', '$upload','$rootScope', function($http, $upload, $rootScope) {
   var _us = this;
   _us.status = 'idle';
   _us.thumbs = {};
   _us.pending = 0;

   _us.startUpload = function(file, cardid, position, att) {
      _us.status = 'working';
      _us.pending++;

      if (!_us.thumbs[cardid]) _us.thumbs[cardid] = [];
      _us.thumbs['new'][position] = {
         'url': '/static/img/att_default_thumb.png',
         'progress':0
      };

      file.pos = position;

      _us.upload = $upload.upload({
         url : '/upload',
         data : {
            cardid : cardid,
            att : JSON.stringify(att)
         },
         file : file
      })
      .progress(function(evt) {
         var position = this.file.pos;
         _us.thumbs['new'][position].progress = parseInt(100.0 * evt.loaded / evt.total);
      })
      .success(function(data, status, headers, config) {
         var position = config.file.pos;
         // file is uploaded successfully
         _us.thumbs['new'][position].url = '/static/img/error.jpg';

         // create thumbnail on server
         _us.thumbs['new'][position].progress = 'creating thumb';
         console.log(data);
         //TODO: too much passing around of position, it's already in the data.config of initial call. realy?

         //TODO: the below works nicvely, but I still need to resolve why multiple $https bloch each other
         //Commenting the below out makes that easier
         /*$http({
            method : 'POST',
            url : '/createthumb',
            data : {
               positionInUi: position,
               filename: data.filename,
               id: data.id
            }
         })
         // display thumbnail in client
         .success(function(data, status, header, config) {
            var position = data.positionInUi;
            _us.thumbs['new'][position].url = '/thumbnail/' + data.id;
            _us.thumbs['new'][position].progress = 'done';
            _us.pending--;
            if (_us.pending==0) {
               _us.status = 'idle';
            }
         })
         .error(function(error) {
            _us.thumbs['new'][position].url = '/static/img/error.jpg';
            _us.thumbs['new'][position].progress = 'error';
            _us.pending--;
            console.log(error);
         });*/
      });
   };

}]);

