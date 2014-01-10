from flask import request, session
from flask_cuddlyrest.views import ListMongoResource, SingleMongoResource, catch_all
from flask_cuddlyrest.marshaller import Marshaller
from flask_cuddlyrest import CuddlyRest
from json import loads
from bson.objectid import ObjectId  # @UnresolvedImport

from mongoengine.queryset import DoesNotExist
from mongoengine.queryset import NotUniqueError

from oto.notesapi.models import *  # @UnusedWildImport
from oto.adminapi.models import *  # @UnusedWildImport
from oto import app

from oto.adminapi.api import requires_auth

#Custom api calls:
import customapi  # @UnusedImport

#RESTful api manager
api = CuddlyRest(app)


'''
This api is only for logged in users
This is checked via method_decorators = [requires_auth] fom the admin api module and in the Cuddly classes
'''

'''
ATTS
'''

'''
class AttachmentResource(Resource):
    document = Attachment

    filters = {
        'id': [ops.Exact],
    }
    fields = ['id', 'filename']
'''

#TODO: handle exceptions in non flask debug mode
#TODO: why does cuddly not handle referenced models correctly?

'''
STACKS
''' 

class StackListResource(ListMongoResource):
   '''
   GET MULTIPLE, POST
   I overwrite these classes to filter by owner and hide owner from client
   '''
   
   method_decorators = [requires_auth]
   def __init__(self):
      super(ListMongoResource, self).__init__(Stack)
      self.document = Stack
      
   @catch_all
   def post(self):
      '''
      Add a new document
      '''
      #get user
      try:
         user = User.objects.get(username=session['username'])  # @UndefinedVariable
      except DoesNotExist:
         return ({'error':'could not retrieve user object'}),500
      
      #create document
      doc = self.document()
      Marshaller(doc).loads(request.json)
      doc.owner = user
      doc.createdat = datetime.now().strftime('%Y%m%d%H%M%S')
      try:
         doc.save()
      except NotUniqueError:
         return {'error':'stack title not unique'}, 500
      
      #hide owner from client
      toReturn = Marshaller(doc).dumps()
      toReturn['owner'] = None
      return toReturn, 201
   
   @catch_all
   def get(self):
      #get user
      try:
         user = User.objects.get(username=session['username'])  # @UndefinedVariable
      except DoesNotExist:
         return {'error':'could not retrieve user object'}, 500
      
      #retrieve stacks of user
      filter_args, skip, limit, order = self.get_filter_args()
      filter_args['owner'] = user
      docs = self.document.objects.filter(**filter_args)
      if order:
         docs = docs.order_by(order)
      if limit:
         if not skip:
            skip = 0
         docs = docs[skip: skip + limit]
         
      #hide owner from client
      toReturn = []
      for doc in docs:
         temp = Marshaller(doc).dumps()
         temp['owner'] = None
         toReturn.append(temp)
      return toReturn, 200


class StackSingleResource(SingleMongoResource):
   '''
   GET SINGLE, DELETE, PATCH
   I overwrite these classes to filter by owner and hide owner from client
   '''
   
   
   method_decorators = [requires_auth]
   def __init__(self):
      super(SingleMongoResource, self).__init__(Stack)
      self.document = Stack
      
   @catch_all
   def put(self, doc_id):
      #get user
      try:
         user = User.objects.get(username=session['username'])  # @UndefinedVariable
      except DoesNotExist:
         return {'error':'could not retrieve user object'}, 500
      
      #get doc to update and update it
      doc = self.document.objects.get(pk=doc_id, owner = user)
      Marshaller(doc).loads(request.json)
      try:
         doc.save()
      except NotUniqueError:
         return {'error':'stack title not unique'}, 500
      
      #hide owner from client
      toReturn = Marshaller(doc).dumps()
      toReturn['owner'] = None
      return toReturn, 201
   patch = put
        
'''
CARDS

Overwrite POST to combine card with attachments
Overwrite get list to return card attachments with filename
I also hacked the Marshaller for this

Since I do not use the typical register call of cuddly, but I create
my own subclass, I also have to rewrite the _init_ of the SingleResource
'''


class CardListResource(ListMongoResource):
   method_decorators = [requires_auth]
   '''
   All /basename/ requests will hit this resource.
 
   In general we support:
       - GET /: List all of this resource.
       - POST /: Add a new one of this resource.
   '''
   def __init__(self):
      super(ListMongoResource, self).__init__(Card)
      self.document = Card

   @catch_all
   def post(self):
      '''
      Add a new document
      '''
      
      #get user
      try:
         user = User.objects.get(username=session['username'])  # @UndefinedVariable
      except DoesNotExist:
         return {'error':'could not retrieve user object'}, 500
      
      #create card
      card = loads(request.form['card'])
      if card['stackid'] == '':
         #floating stack was created on first api call
         stack = Stack.objects.get(title='Floating', owner=user)  # @UndefinedVariable
         card['stackid'] = stack.id
        
      if card['duedate'] == '': #make sure empty duedates are removed. should not happen but keep as safeguard
         card['duedate'] = None
        
      #atts are readded later
      del card['fileattachments']
      del card['urlattachments']
      if 'fileattachments' in card: 
         del card['fileattachments']
      if 'urlattachments' in card: 
         del card['urlattachments']
      
      
      doc = Card()
      Marshaller(doc).loads(card)
      doc.owner = user
      doc.createdat = datetime.now().strftime('%Y%m%d%H%M%S')
      doc.modifiedat = datetime.now().strftime('%Y%m%d%H%M%S')
      doc.id = ObjectId()
      if 'fileattachments' in request.form:
         atts = loads(request.form['fileattachments'])
         for att in atts:  # @UnusedVariable
            #tell atts with 'new' about cardid. WHY? TODO: rethink about 'new' maybe keep id in client?
            attinstorage = FileAttachment.objects.get(cardid=att['cardid'], position=att['position']) #TODO: really necessary?
            attinstorage.cardid = str(doc.id)
            attinstorage.save()
            doc.fileattachments.append(attinstorage)#.get(id=att['id']))
            
      if 'urlattachments' in request.form:
         atts = loads(request.form['urlattachments'])
         for att in atts:  # @UnusedVariable
            doc.urlattachments.append(UrlAttachment.objects.get(id=att['id']))

      doc.save()
      
      #hide owner from client and treat attachments
      toReturn = Marshaller(doc, fileattachments=doc.fileattachments, urlattachments=doc.urlattachments).dumps()
      toReturn['owner'] = None
      toReturn['clientid'] = request.form['clientid']
      
      return toReturn, 201

   @catch_all
   def get(self):
      #get user
      try:
         user = User.objects.get(username=session['username'])  # @UndefinedVariable
      except DoesNotExist:
         return {'error':'could not retrieve user object'}, 500
      
      #get cards of that user
      filter_args, skip, limit, order = self.get_filter_args()
      filter_args['owner'] = user
      docs = self.document.objects.filter(**filter_args)
      if order:
         docs = docs.order_by(order)
      if limit:
         if not skip:
            skip = 0
            docs = docs[skip: skip + limit]

      #treat attachments and hide owner
      toReturn = []
      for doc in docs:
         temp = Marshaller(doc, fileattachments=doc.fileattachments, urlattachments=doc.urlattachments).dumps()
         temp['owner'] = None
         toReturn.append(temp)
      return toReturn, 200


class CardSingleResource(SingleMongoResource):
   method_decorators = [requires_auth]
   '''
   All /basename/:pk requests will hit this resource.

   In general we support:
       - GET /:pk : Show a single resource
       - DELETE /:pk : Delete this resource
       - PATCH /:pk : Do a partial update on this resource
   '''
   def __init__(self):
      super(SingleMongoResource, self).__init__(Card)
      self.document = Card

   @catch_all
   def put(self, doc_id):
      #get user
      try:
         user = User.objects.get(username=session['username'])  # @UndefinedVariable
      except DoesNotExist:
         return {'error':'could not retrieve user object'}, 500
      
      #get card and update it
      cardid = doc_id
      card = self.document.objects.get(pk=cardid, owner=user)
      
      #the atts were updated during the add addition itself
      updatedcard = request.json
      if 'fileattachments' in updatedcard: 
         del updatedcard['fileattachments']
      if 'urlattachments' in updatedcard: 
         del updatedcard['urlattachments']
      
      Marshaller(card).loads(updatedcard)
      
      #Individual parameters
      if card.duedate == '':
         card.duedate = None
         
      card.owner = user #the client sent None as owner since it did not have the info
      card.modifiedat = datetime.now().strftime('%Y%m%d%H%M%S')
      card.save()
      
      #hide owner from client
      toReturn = Marshaller(card, fileattachments=card.fileattachments, urlattachments=card.urlattachments).dumps()
      toReturn['owner'] = None
      return toReturn, 200
      
      #return self.get(cardid) #It should be just this, but cuddly rest does not handle resource fileds like attachmnents correctly.
   patch = put


api.add_resource(StackListResource, '/stacks/')
api.add_resource(StackSingleResource, '/stacks/<doc_id>')

api.add_resource(CardListResource, '/cards/')
api.add_resource(CardSingleResource, '/cards/<doc_id>')

