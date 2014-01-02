app.controller('CardFormController', ['$scope', '$filter', '$http', '$upload', function($scope, $filter, $http, $upload) {
   
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

      $scope.urlttachmentsList = {};
      urlAttachmentsAdded = [];
      urlAttachmentsRemoved = [];

      $scope.attachmentsChanged = false;
   
      $scope.uploadProgress = {};
      $scope.uploadProgressValue = {};
      $scope.thumbnailProgress = {};
      $scope.urlThumbnailProgress = {};
   
      $scope.isLinkInputVisible = false;
      $scope.formActions = {
         linkInputValue: 'http://www.google.com'
      };

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
      var newCard = $scope.cardFormCard;
      newCard.stackid = $scope.activestackid;

      $http({
         method : 'POST',
         url : '/cards/',
         headers : {
            'Content-Type' : 'application/x-www-form-urlencoded'
         },
         data : $.param({
            card : JSON.stringify(newCard),
            fileattachments : JSON.stringify($scope.fileAttachmentsList),
            urlattachments : JSON.stringify($scope.urlAttachmentsList)
         })
      }).success(function(card) {
         card.fileattachments = angular.copy($scope.fileAttachmentsList);
         card.urlattachments = angular.copy($scope.urlAttachmentsList);
         $scope.cards.push(card);
         $scope.isCardFormVisible = false;
         resetCardForm();
      }).error(function(error) {
         console.log(error);
      });
   };
   
   //EDIT
   $scope.$on('startCardEdit', function(event, card) {
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
               fileLink : "/download/" + att.id,
               thumbLink : "/thumbnail/" + att.id,
               delVisible : true,
               position : i
            };
         });
      }
      if (card.urlattachments != null) {
         jQuery.each(card.urlattachments, function(i, att) {//TODO: after att delete and reopen for edit . error here
            $scope.urlAttachmentsList[i] = {
               id : att.id,
               url : att.url,
               thumbLink : "/thumbnaillink/" + att.id,
               delVisible : true,
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

   $scope.onFileSelect = function($files) {
      //$files: an array of files selected, each file has name, size, and type.

      //Define cardId
      var cardId;
      if (!$scope.cardFormCard) {
         cardId = 'new';
      } else {
         if ($scope.cardFormCard === '') {
            cardId = 'new';
         } else {
            cardId = $scope.cardFormCard.id;
         }
      }

      //Handle each file
      for (var i = 0; i < $files.length; i++) {
         var index = Object.keys($scope.fileAttachmentsList).length,
             $file = $files[i];

         //Start displaying thumb placeholder with progress
         var newAtt = {
            id : $file.name,
            filename : $file.name,
            fileLink : '',
            thumbLink : '/static/img/att_default_thumb.png',
            delVisible : false,
            position : index
         };

         $scope.fileAttachmentsList[index] = newAtt;


         //Start upload
         $scope.uploadProgress[index] = true;
         $scope.thumbnailProgress[index] = false;

         $file.pos = index;

         $scope.$apply(); //Important
         $scope.upload = $upload.upload({
            url : '/upload',
            data : {
               cardid : cardId,
               att : JSON.stringify(newAtt)
            },
            file : $file
         }).progress(function(evt) {
            var index = this.file.pos;
            $scope.uploadProgressValue[index] = parseInt(100.0 * evt.loaded / evt.total);
         }).then(function(data, status, headers, config) {
            var index = data.config.file.pos;
            // file is uploaded successfully
            $scope.fileAttachmentsList[index] = {
               id : data.id,
               filename : data.filename,
               fileLink : '',
               thumbLink : '/static/img/att_default_thumb.png'
            };
            // create thumbnail on server
            $scope.uploadProgress[index] = false;
            $scope.thumbnailProgress[index] = true;
            $http({
               method : 'POST',
               url : '/createthumb',
               data : $.param(data.data),
               headers : {
                  'Content-Type' : 'application/x-www-form-urlencoded'
               }
            })
            // display thumbnail in client
            .success(function(data, status, header) {
               var index = data.positionInUi;
               fileAttachmentsAdded.push(data.id);
               $scope.fileAttachmentsList[index] = {
                  id : data.id,
                  filename : data.filename,
                  fileLink : '/download/' + data.id,
                  thumbLink : '/thumbnail/' + data.id,
                  delVisible : true,
                  position: index
               };
               $scope.attachmentsChanged = true;
               $scope.uploadProgress[index] = false;
               $scope.thumbnailProgress[index] = false;
            })
            .error(function(error) {
               console.log(error);
            });
         });
      }
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
      $scope.formActions.linkInputValue = '';
   };

   $scope.addLink = function() {
      $scope.isLinkInputVisible = false;

      //Define cardId
      var cardId;
      if (!$scope.cardFormCard) {
         cardId = 'new';
      } else {
         if ($scope.cardFormCard === '') {
            cardId = 'new';
         } else {
            cardId = $scope.cardFormCard.id;
         }
      }

      var index = Object.keys($scope.urlAttachmentsList).length;

      //Start displaying thumb placeholder with progress
      var newAtt = {
         url : $scope.formActions.linkInputValue,
         thumbLink : '/static/img/att_default_thumb.png',
         delVisible : false,
         position : index,
         cardid:cardId
      };

      $scope.urlAttachmentsList[index] = newAtt;

      //Start thumbnail creation
      $scope.urlThumbnailProgress[index] = true;

      $http({
         method:'POST',
         url: '/addlink/',
         type:'JSON',
         data: {
            cardid : cardId,
            att : JSON.stringify(newAtt)
         }
      })
      .success(function(data) {
         var index = data.positionInUi;
         urlAttachmentsAdded.push(data.id);
         $scope.urlAttachmentsList[index] = {
            id : data.id,
            url : data.url,
            thumbLink : '/thumbnaillink/' + data.id,
            delVisible : true,
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
      if ($scope.formActions.linkInputValue) {
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

}]);