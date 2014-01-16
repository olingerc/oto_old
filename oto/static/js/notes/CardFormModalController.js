app.controller('CardFormModalInstanceCtrl', ['$scope', '$filter', '$http', '$modalInstance', 'CardToEdit', '$fileUploader', 'thumbService', function($scope, $filter, $http, $modalInstance, CardToEdit, $fileUploader, thumbService) {

   var resolvePost = {},
      resolveUpdate = {};

   /*************
    *
    * Initial form status on modal open
    *
    ***********/
   var emptyCard = {
      title : '',
      content : '',
      duedate : ''
   };

   resetCardForm(); //TODO: actually only initial link input value here is interestin g on carform opne. since it's always a new modal instance'

   //Define state depending or new or add
   if (CardToEdit) {
      if (thumbService.areAttsPending(CardToEdit.id)  || CardToEdit.saving) {
         $modalInstance.close(); //safeguard
         return;
      }

      $scope.cardFormAction = 'edit';
      $scope.cardFormCard = angular.copy(CardToEdit);

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

      $scope.originalCard = CardToEdit;
      //we keep original card in order to detect whethter the save button should be enabled

      $scope.fileAttachmentsList = $scope.cardFormCard.fileattachments;
      $scope.urlAttachmentsList = $scope.cardFormCard.urlattachments;
   } else {
      $scope.cardFormAction = 'new';
      $scope.cardFormCard = angular.copy(emptyCard);
      $scope.cardFormCard.id = 'new' + makeid();
   }

   /***************
    * Date picker
    *
    *********************/

  $scope.today = function() {
    $scope.cardFormCard.duedate = new Date();
  };
  $scope.today();

  $scope.showWeeks = true;
  $scope.toggleWeeks = function () {
    $scope.showWeeks = ! $scope.showWeeks;
  };

  $scope.clear = function () {
    $scope.cardFormCard.duedate = null;
  };

  //Disable weekend selection
  $scope.disabled = function(date, mode) {
    return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
  };

  $scope.open = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
//TODO does not workl
    $scope.opened = true;
  };

  $scope.dateOptions = {
    'year-format': "'yyyy'",
    'starting-day': 1
  };

  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'shortDate'];
  $scope.format = $scope.formats[1];

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

      $scope.urlAttachmentsList = [];
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
      $scope.cardFormCard = angular.copy(emptyCard);

      $scope.isLinkInputVisible = false;

      //Special
      $("#duedate").val('');
   }

   $scope.doCardFormAction = function() {
      $modalInstance.close(); //TODO dismiss?
      if ($scope.cardFormAction == 'edit') {
         editCard();
      } else {
         addCard();
      }
   };

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

      //Save card on server
      resolvePost[clientid] = function() {
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

      if (thumbService.areAttsPending(clientid) === false) {
         resolvePost[clientid].apply();
         delete resolvePost[clientid];
      }

   };

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

      resolveUpdate[updatedCardToSend.id] = function() {
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
            })
            .error(function(error) {
               console.log(error);
            });
      };

      if (thumbService.areAttsPending(updatedCardToSend.id) === false) {
         resolveUpdate[updatedCardToSend.id].apply();
         delete resolveUpdate[updatedCardToSend.id];
      }
   };

   $scope.cancelCardForm = function() {
      $modalInstance.dismiss();
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

         return true;
      } else {
         return $scope.cardForm.$invalid;
      }
   };

   $scope.isLinkInputValueInvalid = function() {
      if ($scope.linkInputValue) {
         return false;
      } else {
         return true;
      }
   };


   /*************
    *
    * File Uploader
    *
    * **********/

   $scope.thumbService = thumbService; //only for view, don't use $scope.thumbService to update, but thumbService

   $scope.initFileUpload = function() {
      $('#fileInput').click();
   };

   var uploader = $scope.uploader = $fileUploader.create({
      scope: $scope,
      url: '/upload',
      autoUpload: true,
      removeAfterUpload: true
   });

   uploader.bind('afteraddingfile', function (event, item) {
      //console.info('After adding a file', item);
      var cardid = $scope.cardFormCard.id,
         clientid = makeid(),
         position = $scope.fileAttachmentsList.length;

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
      $scope.attachmentsChanged = true;

      thumbService.storeThumbnail(cardid, clientid, null);
   });

   uploader.bind('progress', function (event, item, progress) {
      //console.info('Progress: ' + progress, item);
      var clientid = item.formData[0].clientid;
      thumbService.changeStatus(clientid, progress);
      $scope.$apply(); //important for change of thumbnails
   });

   uploader.bind('success', function (event, xhr, item, response) {
      //console.info('Success', xhr, item, response);
      var clientid = item.formData[0].clientid,
         serverid = response.id;

      thumbService.storeThumbnail(item.formData[0].cardid, clientid, serverid);
      thumbService.changeStatus(clientid, 'done');
      thumbService.changeStatus(serverid, 'done');
      fileAttachmentsAdded.push(serverid);

      $scope.$apply(); //If multiple files, this forces to get thumnail of previously finished ones
   });

   uploader.bind('cancel', function (event, xhr, item) {
      //console.info('Cancel', xhr, item);
   });

   uploader.bind('error', function (event, xhr, item, response) {
      console.info('Error', xhr, item, response);
   });

   uploader.bind('complete', function (event, xhr, item, response) {
     // console.info('Complete', xhr, item, response);
      var cardid = item.formData[0].cardid;
      if (thumbService.areAttsPending(cardid) === false) {
         if (resolveUpdate[cardid]) {
            resolveUpdate[cardid].apply();
            delete resolveUpdate[cardid];
         }
         if (resolvePost[cardid]) {
            resolvePost[cardid].apply();
            delete resolvePost[cardid];
         }
      }
   });

   $scope.removeAtt = function(att) {
      var serverid = thumbService.getServerId(att.clientid, att.id);
      fileAttachmentsRemoved.push(serverid);
      $scope.fileAttachmentsList.splice($scope.fileAttachmentsList.indexOf(att), 1);
      $scope.attachmentsChanged = true;
   };


   /*******************
    *
    * Links
    *
    ********************/

   $scope.initAddLink = function() {
      $scope.isLinkInputVisible = true;
   };

   $scope.cancelAddLink = function() {
      $scope.isLinkInputVisible = false;
      $scope.linkInputValue = '';
   };

   $scope.addLink = function() {
      $scope.isLinkInputVisible = false;
      var cardid = $scope.cardFormCard.id,
         clientid = makeid(),
         position = $scope.urlAttachmentsList.length;

      //Display empty thumb, will be filled later
      var newLink = {
         url : $scope.linkInputValue,
         clientid:clientid,
         cardid:cardid,
         position:position
      };

      $scope.urlAttachmentsList[position] = newLink;
      $scope.attachmentsChanged = true;

      thumbService.storeThumbnail(cardid, clientid, null);

      $http({
         method:'POST',
         url: '/addlink/',
         type:'JSON',
         data: {
            cardid : cardid,
            att : JSON.stringify(newLink),
            clientid: clientid
         }
      })
      .success(function(data, status, headers, config) {
         urlAttachmentsAdded.push(data.id);

         thumbService.storeThumbnail(config.data.cardid, data.clientid, data.id);
         thumbService.changeStatus(data.id, 'done');

         if (thumbService.areAttsPending(config.data.cardid) === false) {
            if (resolveUpdate[config.data.cardid]) {
               resolveUpdate[config.data.cardid].apply();
               delete resolveUpdate[config.data.cardid];
            }
            if (resolvePost[config.data.cardid]) {
               resolvePost[config.data.cardid].apply();
               delete resolvePost[config.data.cardid];
            }
         }
      })
      .error(function(error) {
         console.log(error);
      });
   };

   $scope.removeLink = function(att) {
      var serverid = thumbService.getServerId(att.clientid, att.id);
      urlAttachmentsRemoved.push(serverid);
      $scope.urlAttachmentsList.splice($scope.urlAttachmentsList.indexOf(att), 1);
      $scope.attachmentsChanged = true;
   };

}]);