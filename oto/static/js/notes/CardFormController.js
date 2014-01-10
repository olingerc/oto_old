app.controller('CardFormController', ['$scope', '$rootScope', '$filter', '$http', '$fileUploader', 'uploadService', function($scope, $rootScope, $filter, $http, $fileUploader, uploadService) {

   /*************
    *
    * Initial form status
    *
    ***********/
   $scope.isCardFormVisible = false;
   resetCardForm();

   /*************
    *
    * CardForm Actions
    *
    ************/
   function resetCardForm() {
      //Set to initial state
      $scope.cardFormAction = 'new';

      $scope.fileAttachmentsList = {};
      fileAttachmentsAdded = [];
      fileAttachmentsRemoved = [];

      $scope.urlAttachmentsList = {};
      urlAttachmentsAdded = [];
      urlAttachmentsRemoved = [];

      $scope.attachmentsChanged = false;

      $scope.uploadProgress = {};
      $scope.uploadProgressValue = {};
      $scope.thumbnailProgress = {};
      $scope.urlThumbnailProgress = {};

      $scope.isLinkInputVisible = false;
      $scope.linkInputValue = 'http://www.google.com';

      //Take away error meassages
      $scope.titleError = false;
      $scope.titleErrorMessage = '';
      //Set temporary objects to empty
      $scope.originalCard = null;
      var emptyCard = {
         title : '',
         content : '',
         duedate : ''
      };
      $scope.cardFormCard = angular.copy(emptyCard);

      $scope.isLinkInputVisible = false;

      //Special
      $("#duedate").val('');
   }

   $scope.doCardFormAction = function() {
      if ($scope.cardFormAction == 'edit') {
         editCard();
      } else {
         addCard();
      }
   };

   //ADD CARD
   $scope.$on('startAddCard', function() {
      resetCardForm();
      $scope.isCardFormVisible = true;
      $scope.cardFormCard.id = 'new';
   });

   var addCard = function() {
      //TODO: block ability to add new card unitl finished. I could also not use 'new' but generate a random token that server gives back
      //will be solved if I add unique id after 'new' and check for 'new' in string to differentiate add ing and editing card
      //and I can use to find card again on client in success
      //so first add card, than http, then update card with server info
      var newCard = $scope.cardFormCard;
      var clientid = 'new';
      newCard.stackid = $scope.activestack.id;
      newCard.clientid = clientid;
      newCard.fileattachments = angular.copy($scope.fileAttachmentsList);
      newCard.urlattachments = angular.copy($scope.urlAttachmentsList);
      //TODO: set modifiedat and createdat for correct sorting until real dates come back from server
      newCard.saving = true;

      if (newCard.duedate == '') {
         newCard.duedate = null;
      }

      //Display card in UI
      $scope.cards.push(newCard);

      //Prepapre UI for next card add
      $scope.isCardFormVisible = false;
      resetCardForm();

      //Save card on server
      $http({
         method : 'POST',
         url : '/cards/',
         headers : {
            'Content-Type' : 'application/x-www-form-urlencoded'
         },
         data : $.param({
            card : JSON.stringify(newCard),
            fileattachments : JSON.stringify(newCard.fileattachments),
            urlattachments : JSON.stringify(newCard.urlattachments),
            clientid: clientid
         })
      }).success(function(card) {
         var found = $filter('filter')($scope.cards, {clientid:card.clientid});
         if (found.length === 1) {
            //Update paramters calculated on server
            found[0].id = card.id;
            found[0].createdat = card.createdat;
            found[0].modifiedat = card.modifiedat;
            found[0].saving = false;
            //found[0] = card; not good because of $$hash?
         } else {
            console.log(found)
            alert('Error saving card:' +  card.id);
         }
      }).error(function(error) {
         console.log(error);
      });

   };

   //EDIT
   $scope.$on('startCardEdit', function(event, card) {
      if (window.getSelection) { //Because of double click we select --> unselect
          window.getSelection().removeAllRanges();
      }
      else if (document.selection) {
          document.selection.empty();
      }

      $scope.isCardFormVisible = true;
      $scope.cardFormAction = 'edit';

      $scope.cardFormCard = card;
      if (card.duedate) {
         card.duedate = $card.duedate.substring(0, 10);
      }
      //otherwise not recognized

      $scope.originalCard = angular.copy(card);
      //we keep original card in order to detect whethter the save button should be enabled

      $scope.fileAttachmentsList = [];
      $scope.urlAttachmentsList = [];
      if (card.fileattachments != null) {
         jQuery.each(card.fileattachments, function(i, att) {//TODO: after att delete and reopen for edit . error here
            $scope.fileAttachmentsList[i] = {
               id : att.id,
               filename : att.filename,
               position : i
            };
         });
      }
      if (card.urlattachments != null) {
         jQuery.each(card.urlattachments, function(i, att) {//TODO: after att delete and reopen for edit . error here
            $scope.urlAttachmentsList[i] = {
               id : att.id,
               position : i
            };
         });
      }
   });

   var editCard = function() {
      if ($scope.cardForm.$invalid) {
         return; //safeguard
      }

      //Handle attachments first
      var filesToDelete = [];
      //1)Those in added AND removed --> delete
      jQuery.each(fileAttachmentsAdded, function(key, value) {
         if (fileAttachmentsRemoved.indexOf(value) > -1) {
            filesToDelete.push(value);
         }
      });
      //2)Those in removed --> delete
      filesToDelete = filesToDelete.concat(fileAttachmentsRemoved);
      //3)those in added --> do nothing
      //-->DELETE
      if (filesToDelete.length > 0) {
         $http({
            method : 'POST',
            url : '/deleteatts',
            headers : {
               'Content-Type' : 'application/x-www-form-urlencoded'
            },
            data : $.param({
               cardid : $scope.cardFormCard.id,//TODO: handle 'new'
               array : JSON.stringify(_.uniq(filesToDelete))
            })
         });
      }

      //Handle urls next the same way
      var urlsToDelete = [];
      jQuery.each(urlAttachmentsAdded, function(key, value) {
         if (urlAttachmentsRemoved.indexOf(value) > -1) {
            urlsToDelete.push(value);
         }
      });
      urlsToDelete = urlsToDelete.concat(urlAttachmentsRemoved);
      if (urlsToDelete.length > 0) {
         $http({
            method : 'POST',
            url : '/deletelink',
            headers : {
               'Content-Type' : 'application/x-www-form-urlencoded'
            },
            data : $.param({
               cardid : $scope.cardFormCard.id,
               array : JSON.stringify(_.uniq(urlsToDelete))
            })
         });
      }

      if (angular.equals($scope.originalCard, $scope.cardFormCard) && $scope.attachmentsChanged === false) {
         $scope.isCardFormVisible = false;
         return;
         //Nothing was changed
      }
      var updatedCardToSend = $scope.cardFormCard;
      delete updatedCardToSend.fileattachments;//attachemnts update already done while adding/removing attachment
      delete updatedCardToSend.urlattachments;//attachemnts update already done while adding/removing attachment

      $http.put('/cards/' + $scope.cardFormCard.id, updatedCardToSend)
      .success(function(updatedCard) {
         //Update attachments in model (server already ok)
         var filtered = $filter('filter')($scope.cards, {id : updatedCard.id});

         $scope.cards[$scope.cards.indexOf(filtered[0])] = angular.copy(updatedCard);

         $scope.isCardFormVisible = false;

         $scope.cardFormCard.fileattachments = angular.copy($scope.fileAttachmentsList);
         $scope.cardFormCard.urlattachments = angular.copy($scope.urlAttachmentsList);
         resetCardForm();
      }).error(function(error) {
         console.log(error);
      });
   };

   //CANCEL
   $scope.$on('cancelCardForm', function() {
      $scope.cancelCardForm();
   });

   $scope.cancelCardForm = function() {
      //TODO: only do this if cardform is visible because of lots of broadcast to cancelcardform?
      $scope.isCardFormVisible = false;
      if ($scope.cardFormAction === 'edit') {
         //Handle file attachments first
         var filesToDelete = [];
         //1)Those in added AND removed --> delete
         jQuery.each(fileAttachmentsAdded, function(key, value) {
            if (fileAttachmentsRemoved.indexOf(value) > -1) {
               filesToDelete.push(value);
            }
         });
         //2)Those in removed --> delete
         filesToDelete = filesToDelete.concat(fileAttachmentsAdded);
         //3)those in added --> do nothing

         //Handle url attachments next and the same way
         var urlsToDelete = [];
         jQuery.each(urlAttachmentsAdded, function(key, value) {
            if (urlAttachmentsRemoved.indexOf(value) > -1) {
               urlsToDelete.push(value);
            }
         });
         urlsToDelete = urlsToDelete.concat(urlAttachmentsAdded);

         cleanAttsOnCancel(filesToDelete, urlsToDelete);
      } else {
         //remove ALL added
         cleanAttsOnCancel(fileAttachmentsAdded, urlAttachmentsAdded);
      }
      resetCardForm();
   };

   function cleanAttsOnCancel(filesToDelete, urlsToDelete) {
      if (filesToDelete.length > 0) {
         $http({
            method : 'POST',
            url : '/deleteatts',
            headers : {
               'Content-Type' : 'application/x-www-form-urlencoded'
            },
            data : $.param({
               cardid : $scope.cardFormCard.id,
               array : JSON.stringify(_.uniq(filesToDelete)),
               changeModifiedat : false
            })
         });
      }
      if (urlsToDelete.length > 0) {
         $http({
            method : 'POST',
            url : '/deletelink',
            headers : {
               'Content-Type' : 'application/x-www-form-urlencoded'
            },
            data : $.param({
               cardid : $scope.cardFormCard.id,
               array : JSON.stringify(_.uniq(urlsToDelete)),
               changeModifiedat : false
            })
         });
      }
   }

   //Save button enable/disable
   $scope.isSaveDisabled = function() {
      if ($scope.cardFormAction === 'edit') {
         //invalid is always bad:
         if ($scope.cardForm.$invalid) {
            return true;
         }

         if ($scope.attachmentsChanged === true && angular.equals($scope.cardFormCard, $scope.originalCard)) {
            return false;
         }
         if ($scope.attachmentsChanged === false && !angular.equals($scope.cardFormCard, $scope.originalCard)) {
            return false;
         }
         if ($scope.attachmentsChanged === true && !angular.equals($scope.cardFormCard, $scope.originalCard)) {
            return false;
         }

         //TODO, changing duedate does not actvate button
         return true;
      } else {
         return $scope.cardForm.$invalid;
      }
   };

   /*******************
    *
    * FILE MANAGER CARDFORM
    *
    * http://angular-file-upload.appspot.com/
    * https://github.com/danialfarid/angular-file-upload
    *
    ********************/

   $scope.initFileUpload = function() {
      $('#fileInput').click();
   };

   //Attachments handling

   $scope.removeAtt = function(position) {
      fileAttachmentsRemoved.push($scope.fileAttachmentsList[position].id);
      delete $scope.fileAttachmentsList[position];
      $scope.attachmentsChanged = true;
   };

   $scope.initAddLink = function() {
      $scope.isLinkInputVisible = true;
   };

   $scope.cancelAddLink = function() {
      $scope.isLinkInputVisible = false;
      $scope.linkInputValue = '';
   };

   //$scope.thumbs = {};
   $scope.addLink = function() {
      $scope.isLinkInputVisible = false;

      //Define cardid
      var cardid;
      if (!$scope.cardFormCard) {
         cardid = 'new';
      } else {
         if ($scope.cardFormCard === '') {
            cardid = 'new';
         } else {
            cardid = $scope.cardFormCard.id;
         }
      }

      var index = Object.keys($scope.urlAttachmentsList).length;

      //Start displaying thumb placeholder with progress
      var newAtt = {
         position : index,
         cardid:cardid
      };

      $scope.urlAttachmentsList[index] = newAtt;

      //Start thumbnail creation
      $scope.urlThumbnailProgress[index] = true;

      $scope.thumbs[index] = '/static/img/att_default_thumb.png';

      $http({
         method:'POST',
         url: '/addlink/',
         type:'JSON',
         data: {
            cardid : cardid,
            att : JSON.stringify(newAtt)
         }
      })
      .success(function(data) {
         var index = data.positionInUi;
         urlAttachmentsAdded.push(data.id);
         $scope.thumbs[index] = '/thumbnaillink/' + data.id;
         $scope.urlAttachmentsList[index] = {
            id : data.id,
            position: index
         };
         $scope.attachmentsChanged = true;
         $scope.urlThumbnailProgress[index] = false;
      })
      .error(function(error) {
         console.log(error);
      });
   };

   $scope.isLinkInputValueInvalid = function() {
      if ($scope.linkInputValue) {
         return false;
      } else {
         return true;
      }
   };

   $scope.removeLink = function(position) {
      urlAttachmentsRemoved.push($scope.urlAttachmentsList[position].id);
      delete $scope.urlAttachmentsList[position];
      $scope.attachmentsChanged = true;
   };


   /*************
    *
    * File Uploader
    *
    * **********/
   $rootScope.uploadService = uploadService;
   var uploader = $scope.uploader = $fileUploader.create({
      scope: $scope,                          // to automatically update the html. Default: $rootScope
      url: '/upload',
      autoUpload: true
   });

   uploader.bind('afteraddingfile', function (event, item) {
      //console.info('After adding a file', item);
      var cardid;
      if (!$scope.cardFormCard) {
         cardid = 'new';
      } else {
         if ($scope.cardFormCard === '') {
            cardid = 'new';
         } else {
            cardid = $scope.cardFormCard.id;
         }
      }

      var clientid = makeid();
      var position = Object.keys($scope.fileAttachmentsList).length;

      //Display empty thumb, will be filled later
      var newAtt = {
         filename : item.file.name,
         clientid:clientid,
         cardid:cardid,
         position:position
      };

      item.formData = [
         {
            cardid:cardid,
            att:JSON.stringify(newAtt),
            clientid: clientid
         }
      ];

      $scope.fileAttachmentsList[position] = newAtt;

      //Update UI
      $rootScope.uploadService.pending++;
      $rootScope.uploadService.storeThumbnail(clientid);
      $rootScope.uploadService.changeStatus(clientid, 'init');

      fileAttachmentsAdded.push(cardid + "_" + position);

      $scope.attachmentsChanged = true;
   });

   uploader.bind('afteraddingall', function (event, items) {
      //console.info('After adding all files', items);
   });

   uploader.bind('beforeupload', function (event, item) {
      //console.info('Before upload', item);
      $rootScope.uploadService.status='working';
   });

   uploader.bind('progress', function (event, item, progress) {
      //console.info('Progress: ' + progress, item);
      var clientid = item.formData[0].clientid;
      $rootScope.uploadService.changeStatus(clientid, progress);
   });

   uploader.bind('success', function (event, xhr, item, response) {
      //console.info('Success', xhr, item, response);
      var clientid = item.formData[0].clientid;
      $rootScope.uploadService.changeStatus(clientid, 'thumb');

      $http({
         method : 'POST',
         url : '/createthumb',
         data : {
            filename: item.file.name,
            id: response.id,
            clientid: clientid
         }
      })
      // display thumbnail in client
      .success(function(data, status, header, config) {
         var clientid = data.clientid;
         var serverid = data.id;
         $rootScope.uploadService.storeThumbnail(clientid, serverid);

         $rootScope.uploadService.changeStatus(clientid, 'done');
         $rootScope.uploadService.pending--;
         if ($rootScope.uploadService.pending==0) {
            $rootScope.uploadService.pending = 'idle';
         }
      })
      .error(function(error) {
         //TODO: get clientid form response
         //$rootScope.uploadService.changeStatus(cardid, 'error', position);
         $rootScope.uploadService.pending--;
         console.log(error);
      });


   });

   uploader.bind('cancel', function (event, xhr, item) {
      //console.info('Cancel', xhr, item);
   });

   uploader.bind('error', function (event, xhr, item, response) {
      console.info('Error', xhr, item, response);
   });

   uploader.bind('complete', function (event, xhr, item, response) {
     // console.info('Complete', xhr, item, response);
   });

   uploader.bind('progressall', function (event, progress) {
      //console.info('Total progress: ' + progress);
   });

   uploader.bind('completeall', function (event, items) {
      //console.info('Complete all', items);
      $rootScope.uploadService.pending = 0;
      $rootScope.uploadService.status='idle';
   });

}]);