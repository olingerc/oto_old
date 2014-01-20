from mongoengine.queryset import DoesNotExist
from datetime import datetime
from functools import wraps
from flask import session, make_response, render_template

from oto import app
from models import Stack
import fileattachments
import urlattachments
from json import dumps

from oto.adminapi.api import requires_auth_api
from oto.adminapi.models import User  # @UnusedWildImport

from oto.notesapi.models import UrlAttachment, Attachment

from oto.utils import set_user_cookie

'''
This api is only for looged in users
This is checked via method_decorators = [requires_auth_api] in the admin api classes
'''

#on notes page load, we need to check if the floating stack for that user already exists
def init_notesapp(function):
   @wraps(function)
   def decorated_function(*args, **kwargs):
      if 'username' not in session or session['username'] is None or session['username'] == '':
         #This bypasses the actual set cookie for angularAuthentication in the notes route. So call it here!
         resp = make_response(render_template('app.html'))
         set_user_cookie(resp)
         return resp, 401

      #Check if this user already has a floating stack
      try:
         user = User.objects.get(username=session['username'])  # @UndefinedVariable
      except DoesNotExist:
         return dumps({'error':'could not retrieve user object while creating floating stack'}), 500
      try:
         #does the stack exist already, if not, create it
         stack = Stack.objects.get(title='Floating', owner=user)  # @UndefinedVariable
      except DoesNotExist:
         try:
            stack = Stack(
                       title='Floating',
                       owner = user,
                       createdat = datetime.now().strftime('%Y%m%d%H%M%S')
                    )
            stack.save()
         
         except:
            return dumps({'error':'could not create floating stack'}), 500
        
         
      #Remove floating 'new' atts
      attinstorage = Attachment.objects.filter(cardid__startswith='new')
      for att in attinstorage:
         if 'file' in att:
            att.file.delete()
         else:
            att.image.delete
         att.delete()
         
      linksinstorage = UrlAttachment.objects.filter(cardid__startswith='new')
      for att in linksinstorage:
         att.delete()
         
      return function(*args, **kwargs)   
   return decorated_function 



'''
Attachments view functions
'''
#FILES
    
@app.route('/upload', methods = ['POST'])
@requires_auth_api
def uploadfiles():
   return fileattachments.uploadFiles()

@app.route('/deleteatts', methods = ['POST'])
@requires_auth_api
def deleteatts():
   return fileattachments.deleteatts()

@app.route('/createthumb', methods = ['POST'])
@requires_auth_api
def createthumb():
   return fileattachments.create_thumbnail()

@app.route('/thumbnail/<fileid>')
@requires_auth_api
def serve_thumbnail(fileid):
   return fileattachments.serve_thumbnail(fileid)

@app.route('/download/<fileid>')
@requires_auth_api
def serve_file(fileid):
   return fileattachments.serve_file(fileid)


#LINKS
@app.route('/addlink', methods = ['POST'])
@requires_auth_api
def addlink():
   return urlattachments.saveLinkToMongo()

@app.route('/thumbnaillink/<urlattachmentid>')
@requires_auth_api
def serve_urlattachment_thumbnail(urlattachmentid):
   return urlattachments.serve_urlattachment_thumbnail(urlattachmentid)

@app.route('/deletelink', methods = ['POST'])
@requires_auth_api
def delete_urlattachment():
   return urlattachments.deleteurlattachment()
