from flask import request, session, send_file, after_this_request, make_response, render_template, g
from flask_cuddlyrest.views import ListMongoResource, SingleMongoResource, catch_all
from flask_cuddlyrest.marshaller import Marshaller
from flask_cuddlyrest import CuddlyRest
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash


import subprocess
import tarfile
import shutil
import os

from mongoengine.queryset import DoesNotExist

import json

from oto.notesapi.models import *  # @UnusedWildImport
from oto.adminapi.models import *  # @UnusedWildImport
from oto import app
from oto.settings import MONGODB_SETTINGS

#RESTful api manager
api = CuddlyRest(app)

def requires_auth_route(f):
   @wraps(f)
   def decorated_function(*args, **kwargs):
      #First check if existing session, otherwise check for cookie, then abort 401
      if 'username' not in session or session['username'] is None or session['username'] == '':
         #User not in session --> check for rememberme cookie
         if 'oto_rememberme' in request.cookies:
            rmcookie = request.cookies['oto_rememberme']
            rmcookie = rmcookie.split('_')
            
            try:
               rm = Rememberme.objects.get(hash=rmcookie[1], valid=True)
               if rm['username'] == rmcookie[0]:
                  #COOKIE VALID --> store in session and PROCEED (invalidate and set new cookie)
                  user = User.objects.get(username=rmcookie[0])
                  session['username'] = user.username
                  session['role'] = user.role
                  
                  #invalidate old one
                  rm['valid'] = False
                  rm.save()
                  
                  #create new one and send to client
                  rndhash = os.urandom(16).encode('base-64') #TODOstore hashed in db to avoid visible username in cookie
                  rm = Rememberme(username=user.username, hash=rndhash, valid=True)
                  rm.save()
                  
                  g.new_rm_cookie = rm #keep to set in next response, empty when set
                  g.rm_cookie = rm #keep for logout TODO: empty after logout
                  
                  return f(*args, **kwargs)
               else:
                  #hash and username do not correspond, very unlikely --> invalidate cookie anayway and ask for new login
                  rm['valid'] = False
                  make_response(render_template('app.html')), 401
            except:
               #cookie exists but no longer valid
               make_response(render_template('app.html')), 401
         else:
            #No rememberme cookie there --> new login
            make_response(render_template('app.html')), 401
            
      return f(*args, **kwargs)
   return decorated_function

def requires_auth_admin(f):
   @wraps(f)
   def decorated_function(*args, **kwargs):
      if 'username' not in session or session['username'] is None or session['username'] == '':
         make_response(render_template('app.html')), 401
      else:
         if session['role'] != 'admin':
            make_response(render_template('app.html')), 403
      return f(*args, **kwargs)
   return decorated_function



def requires_auth_api(f):
   @wraps(f)
   def decorated_function(*args, **kwargs):
      if 'username' not in session or session['username'] is None or session['username'] == '':
         make_response(render_template('app.html')), 401
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
   
   rememberme = data['rememberme']
   
   try:      
      user = User.objects.get(username=username)  # @UndefinedVariable
      if check_password_hash(user.password, given_password) == True:
         session['username'] = user.username
         session['role'] = user.role
         
         if rememberme is True:
            #set cookie and store in db
            rndhash = os.urandom(16).encode('base-64') #TODOstore hashed in db to avoid visible username in cookie
            rm = Rememberme(username=user.username, hash=rndhash, valid=True)
            rm.save()
            
            resp = make_response(json.dumps({'username':user.username, 'role':user.role}), 200)
            resp.set_cookie('oto_rememberme', value=user.username + "_" + rndhash, max_age=432000) #TODO: hash cookie
            return resp
            
         else:
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
   session['username'] = ''
   session['role'] = 'public'

   resp = make_response('ok', 200)
   resp.set_cookie('oto_rememberme', '', expires = 0)
   
   return resp


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

@app.route('/exportdb')
@requires_auth_admin
def export_db():
   dumpdir = '/var/tmp/mongodump'
   filename = "mongodump.tar.gz"
   host = MONGODB_SETTINGS['host']
   db = MONGODB_SETTINGS['DB']
   
   cmd = 'mongodump --host ' + host + ' --db ' + db + ' --out "' + dumpdir + '"'
   
   try:
      subprocess.call(cmd, shell=True)
   except:
      return 'error', 500
      raise
   
   os.chdir('/var/tmp/')

   try:
      tar = tarfile.open("/var/tmp/" + filename, "w:gz")
      tar.add('mongodump')
      tar.close()
   except:
      return 'error', 500
      raise
   
   shutil.rmtree(dumpdir)
   return 'ok', 200

@app.route('/exportdbdownload')
@requires_auth_admin
def export_db_download():
   filename = "mongodump.tar.gz"
   
   @after_this_request
   def cleanup(response):
      os.remove("/var/tmp/" + filename)
      return response
   
   return send_file("/var/tmp/" + filename, as_attachment=True)
