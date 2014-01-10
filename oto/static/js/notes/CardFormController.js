app.controller('CardFormController', ['$scope', '$rootScope', '$filter', '$http', '$fileUploader', 'thumbService', function($scope, $rootScope, $filter, $http, $fileUploader, thumbService) {

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

      $scope.fileAttachmentsList = [];
      fileAttachmentsAdded = [];
      fileAttachmentsRemoved = [];

      $scope.urlAttachmentsList = {};
      urlAttachmentsAdded = [];
      urlAttachmentsRemoved = [];

      $scope.attachmentsChanged = false;

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
      $scope.cardFormCard.id = 'new' + makeid();
   });

   var addCard = function() {
      var newCard = $scope.cardFormCard;
      var clientid = $scope.cardFormCard.id;
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
            console.log(found);
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

      $scope.cardFormCard = angular.copy(card); //I do not want the UI to update here, thats why I copy.
      if ($scope.cardFormCard.duedate) {
         $scope.cardFormCard.duedate = $scope.cardFormCard.duedate.substring(0, 10);
      }
      if (!$scope.cardFormCard.fileattachments) {
         $scope.cardFormCard.fileattachments = [];
      }
      if (!$scope.cardFormCard.urlattachments) {
         $scope.cardFormCard.urlattachments = [];
      }
      //otherwise not recognized

      $scope.originalCard = card;
      //we keep original card in order to detect whethter the save button should be enabled

      $scope.fileAttachmentsList = $scope.cardFormCard.fileattachments;
      $scope.urlAttachmentsList = $scope.cardFormCard.urlattachments;
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
               cardid : $scope.cardFormCard.id,
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
         //Nothing was changed (safeguard)
      }
      var updatedCardToSend = $scope.cardFormCard;
      updatedCardToSend.clientid = $scope.cardFormCard.id;
      updatedCardToSend.fileattachments = angular.copy($scope.fileAttachmentsList);
      updatedCardToSend.urlattachments = angular.copy($scope.urlAttachmentsList);
      //TODO: set modifiedat and createdat for correct sorting until real dates come back from server
      updatedCardToSend.saving = true;

      if (updatedCardToSend.duedate == '') {
         updatedCardToSend.duedate = null;
      }

      //Display card in UI
      _.extend($scope.originalCard,updatedCardToSend);

      //Prepapre UI for next card add
      $scope.isCardFormVisible = false;
      resetCardForm();

      $http.put('/cards/' + updatedCardToSend.id, updatedCardToSend)
      .success(function(updatedCard) {
         //Update attachments in model (server already ok)
         updatedCard.saving = false;

         var filtered = $filter('filter')($scope.cards, {id : updatedCard.id});
         if (filtered.length === 1) {
            //Update paramters calculated on server
            $scope.cards[$scope.cards.indexOf(filtered[0])] = updatedCard;
         } else {
            console.log(found);
            alert('Error saving card:' +  card.id);
         }
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
   $scope.removeAtt = function(att) {
      var serverid = $rootScope.thumbService.getUrl(att.clientid, att.id, 'id');
      fileAttachmentsRemoved.push(serverid);
      $scope.fileAttachmentsList.splice($scope.fileAttachmentsList.indexOf(att), 1);
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
      var cardid = $scope.cardFormCard.id;
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
   $rootScope.thumbService = thumbService;
   var uploader = $scope.uploader = $fileUploader.create({
      scope: $scope,                          // to automatically update the html. Default: $rootScope
      url: '/upload',
      autoUpload: true
   });

   uploader.bind('afteraddingfile', function (event, item) {
      //console.info('After adding a file', item);
      var cardid = $scope.cardFormCard.id;
      var clientid = makeid();
      var position = $scope.fileAttachmentsList.length;

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
      $rootScope.thumbService.pending++;
      $rootScope.thumbService.storeThumbnail(clientid);
      $rootScope.thumbService.changeStatus(clientid, 'init');

      $scope.attachmentsChanged = true;
   });

   uploader.bind('afteraddingall', function (event, items) {
      //console.info('After adding all files', items);
   });

   uploader.bind('beforeupload', function (event, item) {
      //console.info('Before upload', item);
      $rootScope.thumbService.status='working';
   });

   uploader.bind('progress', function (event, item, progress) {
      //console.info('Progress: ' + progress, item);
      var clientid = item.formData[0].clientid;
      $rootScope.thumbService.changeStatus(clientid, progress);
   });

   uploader.bind('success', function (event, xhr, item, response) {
      //console.info('Success', xhr, item, response);
      var clientid = item.formData[0].clientid;
      $rootScope.thumbService.changeStatus(clientid, 'thumb');
      fileAttachmentsAdded.push(response.id);

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
         $rootScope.thumbService.storeThumbnail(clientid, serverid);

         $rootScope.thumbService.changeStatus(clientid, 'done');
         $rootScope.thumbService.pending--;
         if ($rootScope.thumbService.pending==0) {
            $rootScope.thumbService.pending = 'idle';
         }
      })
      .error(function(error) {
         //TODO: get clientid form response or oroginal config to dispaly eror in card
         //$rootScope.thumbService.changeStatus(cardid, 'error', position);
         $rootScope.thumbService.pending--;
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
      $rootScope.thumbService.pending = 0;
      $rootScope.thumbService.status='idle';
   });

}]);