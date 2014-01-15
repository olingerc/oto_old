# For clean_filename, get_or_create_file and upload_simple:
# Copyright 2011, Cabo Communications
# Released under GPL License.

from werkzeug.utils import secure_filename
from os import path, remove
from flask import request, send_file
import mimetypes
import json
import StringIO
from datetime import datetime
from subprocess import call

from models import FileAttachment, Card, ImageAttachment, Attachment

def clean_filename(filename):
   i = filename.rfind(".")
   if i != -1:
      filename = filename[0:i] + filename[i:].lower()
   return secure_filename(filename)

def get_or_create_file(chunk, dst):
   if chunk == 0:
      f = open(dst, 'wb', )
   else:
      f = file(dst, 'ab')
   return f

def upload_simple(request, dst, chunk=0):
   f = get_or_create_file(chunk, dst)

   myfile = request.files['file']
   for b in myfile:
      f.write(b)
   f.close()

def uploadFiles():
   '''PLUPLUOAD'''
   att = json.loads(request.form['att'])
   position = att['position']
   filename = clean_filename(att['filename'])
   dst = path.join('/tmp', filename)
   cardid = request.form['cardid']

   if 'chunk' and 'chunks' in request.form:
      chunk = int(request.form['chunk'])
      chunks = int(request.form['chunks'])
      upload_simple(request, dst, chunk)
      if chunk == chunks -1: #chunk number is 0 based
         return saveToMongo(filename, cardid, position)
   else:
      chunk = 0
      upload_simple(request, dst, chunk)
      return saveToMongo(filename, cardid, position)
    
   return 'error'

def saveToMongo(filename, cardid, position):
   #Put into gridfs
   mimetype = mimetypes.guess_type(filename)[0]
   
   if 'image/' in str(mimetype):
      att = ImageAttachment(filename=filename, mimetype = mimetypes.guess_type(filename)[0])
      att.thumb = True
      with open('/tmp/' + filename, 'r') as fileobject:
         att.image.put(fileobject, content_type = mimetypes.guess_type(filename)[0])
   
   else:
      att = FileAttachment(filename=filename, mimetype = mimetypes.guess_type(filename)[0])
      with open('/tmp/' + filename, 'r') as fileobject:
         att.file.put(fileobject, content_type = mimetypes.guess_type(filename)[0])
       
      #remove from filesystem
      remove('/tmp/' + filename)
       
   #Common for all atts   
   att.cardid = cardid
   att.position = position
   att.save()
    
   #add to card
   if not cardid.startswith('new'):
      #TODO: check if card exists. No multiple users per card yet
      card = Card.objects.get_or_404(id=cardid)  # @UndefinedVariable
      card.fileattachments.append(att)
      card.modifiedat = datetime.now().strftime('%Y%m%d%H%M%S')
      card.save()
      
      
   #Send response or create thumb
   if 'image/' in str(mimetype):
      #prepare response
      tosend = {}
      tosend['id'] = str(att.id)
      tosend['filename'] = att.filename
      
      return json.dumps(tosend),201
   
   else:
      return create_thumbnail(att)

def create_thumbnail(att):
   att.thumb = False #Default
   '''
   If no thumbnail created or error, set att.thumb to False, else True
   IMAGE thumbnails handled by mongoengine
   '''
   if 'pdf' in str(att.mimetype):
      #TODO:
      #http://www.binarytides.com/convert-pdf-image-imagemagick-commandline/

      with open('/var/tmp/' + str(att.id), 'a+') as myFile:
         myFile.write(att.file.read())
         
      command = "convert -density 170 -thumbnail x300 /var/tmp/" + str(att.id) + "[0] -flatten '/var/tmp/" + str(att.id) + ".jpg'"
      call(command, shell=True)
      with open("/var/tmp/" + str(att.id) + ".jpg", 'r') as fileobject:
         att.thumbfile.put(fileobject, content_type = 'image/jpeg')
         att.thumb = True
            
   att.save()
   return json.dumps({'id': str(att.id), 'filename': att.filename, 'clientid':str(att.id)}), 201
            
def deleteatts():
   attids = json.loads(request.form['array'])
   cardid = request.form['cardid']
   if 'changeMofidiedat' in request.form:
      changeMofidiedat = request.form['changeMofidiedat']
      #we do not change it for example whan canceling a card edit
   else:
      changeMofidiedat = True
   
   print attids

   for attid in attids:
      att = Attachment.objects.get_or_404(id=attid)  # @UndefinedVariable
      #TODO: check if exists
      if 'file' in att:
         att.file.delete()
      else:
         att.image.delete()
      att.delete()
   
   if not cardid.startswith('new'):
      card = Card.objects.get_or_404(id=cardid)  # @UndefinedVariable
      if changeMofidiedat == True:
         card.modifiedat = datetime.now().strftime('%Y%m%d%H%M%S')
      card.save()
    
   return 'ok'

def serve_file(fileid):
   att = Attachment.objects.get_or_404(id=fileid)  # @UndefinedVariable

   if 'image/' in att.mimetype:
      strIO = StringIO.StringIO()
      strIO.write(att.image.read())
      strIO.seek(0)
      
      return send_file(strIO, attachment_filename=att.filename, as_attachment=False)
   else:
      strIO = StringIO.StringIO()
      strIO.write(att.file.read())
      strIO.seek(0)
    
      return send_file(strIO, attachment_filename=att.filename, as_attachment=True)

def serve_thumbnail(fileid):
   att = Attachment.objects.get_or_404(id=fileid)  # @UndefinedVariable
   
   if 'mimetype' in att  and 'image/' in att.mimetype:
      thumb = att.image.thumbnail
      strIO = StringIO.StringIO()
      strIO.write(thumb.read())
      strIO.seek(0)
      
   else:
      strIO = StringIO.StringIO()
      strIO.write(att.thumbfile.read())
      strIO.seek(0)
    
   if att.thumb == True:
      return send_file(strIO, mimetype='image/jpeg')
   else:
      return send_file('static/img/att_default_thumb.png')
    

