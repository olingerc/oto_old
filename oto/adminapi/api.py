from flask import request, session, abort
from flask_cuddlyrest.views import ListMongoResource, SingleMongoResource, catch_all
from flask_cuddlyrest.marshaller import Marshaller
from flask_cuddlyrest import CuddlyRest
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash

from mongoengine.queryset import DoesNotExist

import json

from oto.notesapi.models import *  # @UnusedWildImport
from oto.adminapi.models import *  # @UnusedWildImport
from oto import app

#RESTful api manager
api = CuddlyRest(app)

def requires_auth(f):
   @wraps(f)
   def decorated_function(*args, **kwargs):
      if 'username' not in session or session['username'] is None or session['username'] == '':
         return abort(401)
      return f(*args, **kwargs)
   return decorated_function

def requires_auth_admin(f):
   @wraps(f)
   def decorated_function(*args, **kwargs):
      if 'username' not in session or session['username'] is None or session['username'] == '':
         return abort(401)
      else:
         if session['role'] != 'admin':
            return abort(401)
      return f(*args, **kwargs)
   return decorated_function


'''
Adding or editing users requires admin is logged in
This is checked via method_decorators
'''

'''
Users
''' 

class UserListResource(ListMongoResource):
   method_decorators = [requires_auth_admin]
   def __init__(self):
      super(ListMongoResource, self).__init__(User)
      self.document = User
      
   @catch_all
   def post(self):
      '''
      Add a new document
      '''
      doc = self.document()
      Marshaller(doc).loads(request.json)
      doc.password = generate_password_hash(doc.password)
      doc.save()
      return Marshaller(doc).dumps(), 201

class UserSingleResource(SingleMongoResource):
   method_decorators = [requires_auth_admin]
   def __init__(self):
      super(SingleMongoResource, self).__init__(User)
      self.document = User
      
   @catch_all
   def put(self, doc_id):
      doc = self.document.objects.get(pk=doc_id)
      Marshaller(doc).loads(request.json)
      doc.password = generate_password_hash(doc.password)
      doc.save()
      return self.get(doc_id)
   patch = put

api.add_resource(UserListResource, '/users/')
api.add_resource(UserSingleResource, '/users/<doc_id>')



'''
Custom api
'''

@app.route('/checklogin', methods = ['POST'])
def checklogin():
   data = request.json
   username = data['username']
   given_password = data['password']
   try:      
      user = User.objects.get(username=username)  # @UndefinedVariable
      if check_password_hash(user.password, given_password) == True:
         session['username'] = user.username
         session['role'] = user.role
         return json.dumps({'username':user.username, 'role':user.role}), 200
      else:
         logout()
         return json.dumps({ "error": 'does not exist or wrong password' }), 500
   
   except DoesNotExist:
      logout()
      return json.dumps({ "error": 'does not exist or wrong password' }), 500
   except:
      raise
      return json.dumps({ "error": 'unspecific error during user check' }), 500
   
@app.route('/logout', methods=['POST'])
def logout():
   if not 'username' in session:
      session['username'] = ''
   if not 'role' in session:
      session['role'] = 'public'
   session['username'] = ''
   session['role'] = 'public'
   return 'ok', 200


@app.route('/_usersession')
def get_from_session():
   if not 'username' in session:
      session['username'] = ''
   if not 'role' in session:
      session['role'] = 'public'
   user = {
           'username':session['username'],
           'role':session['role']
           }
   return json.dumps(user), 200
