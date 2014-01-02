'use strict';

app.controller('NotesViewController', ['$scope', '$http', '$filter', '$upload', 'Stacks', function($scope, $http, $filter, $upload, Stacks) {

   /********************
    *
    * parent scope variables and model initialization
    *
    ******************/

   var orderPropVerbose = {
      '-modifiedat' : 'Last modified',
      '-createdat' : 'Last created',
      'title' : 'Title'
   };

   $scope.stacks = [];
   $scope.cards = [];

   $scope.fileAttachmentsList = {};
   var fileAttachmentsAdded = [];
   var fileAttachmentsRemoved = [];

   $scope.urlAttachmentsList = {};
   var urlAttachmentsAdded = [];
   var urlAttachmentsRemoved = [];

   $scope.uploadProgress = {};
   $scope.uploadProgressValue = {};
   $scope.thumbnailProgress = {};
   $scope.urlThumbnailProgress = {};

   $scope.cardFormAction = 'new';
   $scope.isCardFormVisible = false;
   $scope.isLinkInputVisible = false;
   $scope.formActions = {
      linkInputValue: 'http://www.google.com'
   };
   //needed in CardFormCtrl and CardCtrl which only have access to their parent scopes

   var emptyCard = {
      title : '',
      content : '',
      duedate : ''
   };

   $scope.stackSizes = {};
   $scope.activestacktitle = "Floating";
   $scope.activestackid = "";
   $scope.attachmentsChanged = false;

   /********************
    *
    *
    * Retrieve models
    *
    *
    ******************/
   Stacks.getAll(function (allStacks, floatingStack) {
      $scope.stacks = allStacks;
      $scope.floatingStack = floatingStack;
   });

   $http.get('/cards/')
   .success(function(response) {
      $scope.cards = response;
      $scope.updateStackSizes();
   })
   .error(function(error) {
      console.log(error);
   });

   //Utility Functions
   $scope.isNotNull = function(value) {
      return value == null ? false : true;
   };
   $scope.dropdown = function(element) {
      $(element).dropdown('toggle');
   };

   /******************
    *
    *
    * Stack operations and display necessary outside Stack Controller
    *
    *
    *************/

   $scope.stackIsActive = function(stacktitle) {
      return stacktitle == $scope.activestacktitle ? true : false;
   };

   //Filter by stack
   $scope.listStackUser = function(stack) {
      $scope.cancelCardForm();
      $scope.search = stack.id;
      $scope.activestacktitle = stack.title;
      $scope.activestackid = stack.id;
   };
   $scope.listStackAll = function(stack) {
      $scope.cancelCardForm();
      $scope.search = "";
      $scope.activestacktitle = 'All';
      $scope.activestackid = '';
   };
   $scope.listStackArchive = function(stack) {
      $scope.cancelCardForm();
      $scope.search = "archive";
      $scope.activestacktitle = 'Archive';
      $scope.activestackid = 'archive';
   };

   //Stacktitle by stackid. In the card I only store id
   $scope.getStacktitle = function(stackid) {
      var stack = $scope.stacks.filter(function(stack) {
         if (stack['id'] === stackid) {
            return stack;
         }
      });
      if (stack.length === 1) {
         return stack[0].title;
      } else {
         return 'Floating';
      }
   };

   //Are we in archive?
   $scope.inArchive = function() {
      return $scope.activestackid === 'archive' ? true : false;
   };

   //Number of cards. Call this on every stack content change (add, remove, move)
   $scope.updateStackSizes = function() {
      jQuery.each($scope.stacks, function(i, stack) {
         var count = 0;
         jQuery.each($scope.cards, function(i, card) {
            if (card.stackid === stack.id && !card.archivedat) {
               count++;
            }
         });
         $scope.stackSizes[stack.id] = count;
         //TODO: optimize this?
      });
   };

   /*
   *
   *
   * Cards controls outside of card controller
   *
   *
   */

   //Sorting
   $scope.orderProp = '-modifiedat';
   $scope.orderPropVerbose = 'Last modified';

   $scope.setOrder = function(orderProp) {
      $scope.orderProp = orderProp;
      $scope.orderPropVerbose = orderPropVerbose[orderProp];
   };

   /*************
    *
    *
    * CardForm
    *
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


      //Take away error meassages
      $scope.titleError = false;
      $scope.titleErrorMessage = '';
      //Set temporary objects to empty
      $scope.originalCard = null;
      $scope.cardFormCard = angular.copy(emptyCard);
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
   $scope.startAddCard = function() {
      $scope.isCardFormVisible = true;
      //inherited
      resetCardForm();
      $scope.cardFormCard.id = 'new';
   };
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
         //cards inherited
         $scope.updateStackSizes();
         //function inherited
         $scope.isCardFormVisible = false;
         resetCardForm();
      }).error(function(error) {
         console.log(error);
      });
   };

   $scope.cancelCardForm = function() {
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

         //Handle url attachments next
         var urlsToDelete = [];
         //1)Those in added AND removed --> delete
         jQuery.each(urlAttachmentsAdded, function(key, value) {
            if (urlAttachmentsRemoved.indexOf(value) > -1) {
               urlsToDelete.push(value);
            }
         });
         //2)Those in removed --> delete
         urlsToDelete = urlsToDelete.concat(urlAttachmentsAdded);
         //3)those in added --> do nothing

         cancelEditCardForm(filesToDelete, urlsToDelete);
      } else {
         //remove ALL added
         cancelEditCardForm(fileAttachmentsAdded, urlAttachmentsAdded);
      }
      resetCardForm();
   };

   function cancelEditCardForm(filesToDelete, urlsToDelete) {
      //-->DELETE thoe in toDelete
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

   $scope.startEditCard = function(card) {
      if ($scope.inArchive()) {
         return;
      }
      $scope.cardFormAction = 'edit';
      $scope.isCardFormVisible = true;

      if (card.duedate)
         card.duedate = card.duedate.substring(0, 10);
      //otherwise not recognized

      $scope.cardFormCard = angular.copy(card);
      $scope.originalCard = angular.copy(card);
      //we keep original card in order to detect whethter the save button should be enabled
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
   };

   $scope.isSaveDisabled = function() {
      if ($scope.cardFormAction === 'edit') {
         //invalid is always bad:
         if ($scope.cardForm.$invalid)
            return true;

         if ($scope.attachmentsChanged === true && angular.equals($scope.cardFormCard, $scope.originalCard))
            return false;
         if ($scope.attachmentsChanged === false && !angular.equals($scope.cardFormCard, $scope.originalCard))
            return false;
         if ($scope.attachmentsChanged === true && !angular.equals($scope.cardFormCard, $scope.originalCard))
            return false;

         //TODO, changing duedate does not actvate button
         return true;
      } else {
         return $scope.cardForm.$invalid;
      }
   };

   var editCard = function() {
      if ($scope.cardForm.$invalid)
         return;
      //safeguard

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

      //Handle urls next
      var urlsToDelete = [];
      //1)Those in added AND removed --> delete
      jQuery.each(urlAttachmentsAdded, function(key, value) {
         if (urlAttachmentsRemoved.indexOf(value) > -1) {
            urlsToDelete.push(value);
         }
      });
      //2)Those in removed --> delete
      urlsToDelete = urlsToDelete.concat(urlAttachmentsRemoved);
      //3)those in added --> do nothing
      //-->DELETE
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

