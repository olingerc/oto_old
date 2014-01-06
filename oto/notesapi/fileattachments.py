# For clean_filename, get_or_create_file and upload_simple:
# Copyright 2011, Cabo Communications
# Released under GPL License.

from werkzeug.utils import secure_filename
from os import path, remove
from flask import request, send_file
import mimetypes
import json
from wand.image import Image
import StringIO
from datetime import datetime

from models import FileAttachment, Card

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
   positionInUi = att['position']
   filename = clean_filename(att['filename'])
   dst = path.join('/tmp', filename)
   cardid = request.form['cardid']

   if 'chunk' and 'chunks' in request.form:
      chunk = int(request.form['chunk'])
      chunks = int(request.form['chunks'])
      upload_simple(request, dst, chunk)
      if chunk == chunks -1: #chunk number is 0 based
         return saveToMongo(filename, cardid,positionInUi)
   else:
      chunk = 0
      upload_simple(request, dst, chunk)
      return saveToMongo(filename, cardid,positionInUi)
    
   return 'error'

def saveToMongo(filename, cardid, positionInUi):
   #Put into gridfs
   att = FileAttachment(filename=filename, mimetype = mimetypes.guess_type(filename)[0])
   with open('/tmp/' + filename, 'r') as fileobject:
      att.file.put(fileobject, content_type = mimetypes.guess_type(filename)[0])
    
   #remove from filesystem
   remove('/tmp/' + filename)
    
   att.save()
    
   #add to card
   if cardid != 'new':
      #TODO: check if card exists. No multiple users per card yet
      card = Card.objects.get_or_404(id=cardid)  # @UndefinedVariable
      card.fileattachments.append(att)
      card.modifiedat = datetime.now().strftime('%Y%m%d%H%M%S')
      card.save()
    
   #prepare response
   tosend = {}
   tosend['id'] = str(att.id)
   tosend['filename'] = att.filename
   tosend['positionInUi'] = positionInUi
   
   return json.dumps(tosend)

def create_thumbnail():
   attid = request.form['id']
   att = FileAttachment.objects.get_or_404(id=attid)  # @UndefinedVariable
   att.thumb = False #Default
   '''
   If no thumbnail created or error, set att.thumb to False, else True
   '''
    
   if 'image' in str(att.mimetype):
      try:
         strIO = StringIO.StringIO()
         strIO.write(att.file.read())
         strIO.seek(0)
            
         with Image(file=strIO) as img:
            thumbStrIO = StringIO.StringIO()
            img.compression_quality = 50
            img.transform(resize='x110')
            img.format = 'jpeg'
            img.save(file=thumbStrIO)
            thumbStrIO.seek(0)
                
            att.thumbfile.put(thumbStrIO, content_type = 'image/jpeg')
            att.thumb = True
      except:
         att.thumb = False
        
   if 'pdf' in str(att.mimetype):
      try:
         strIO = StringIO.StringIO()
         strIO.write(att.file.read())
         strIO.seek(0)
            
         with Image(file=strIO) as img:
            thumbStrIO = StringIO.StringIO()
            img.compression_quality = 50
            img.format = 'jpeg'
            img.save(file=thumbStrIO)
            thumbStrIO.seek(0)
             
            att.thumbfile.put(thumbStrIO, content_type = 'image/jpeg')
            att.thumb = True
      except:
         att.thumb = False
            
   att.save()
   obj = {'id': attid, 'filename': att.filename, 'positionInUi':request.form['positionInUi']}
   return json.dumps(obj)
   #TODO: error on multiple image upload
            
def deleteatts():
   attids = json.loads(request.form['array'])
   cardid = request.form['cardid']
   if 'changeMofidiedat' in request.form:
      changeMofidiedat = request.form['changeMofidiedat']
      #we do not change it for example whan canceling an card edit
   else:
      changeMofidiedat = True
    
   for attid in attids:
      att = FileAttachment.objects.get_or_404(id=attid)  # @UndefinedVariable
      #TODO: chek if exists
      att.file.delete()
      att.delete()
      
      if cardid != 'new':
         card = Card.objects.get_or_404(id=cardid)  # @UndefinedVariable
         if changeMofidiedat == True:
            card.modifiedat = datetime.now().strftime('%Y%m%d%H%M%S')
         card.save()
    
   return 'ok'

def serve_file(fileid):
   att = FileAttachment.objects.get_or_404(id=fileid)  # @UndefinedVariable
    
   strIO = StringIO.StringIO()
   strIO.write(att.file.read())
   strIO.seek(0)
    
   return send_file(strIO, attachment_filename=att.filename, as_attachment=True)

def serve_thumbnail(fileid):
   att = FileAttachment.objects.get_or_404(id=fileid)  # @UndefinedVariable
    
   strIO = StringIO.StringIO()
   strIO.write(att.thumbfile.read())
   strIO.seek(0)
    
   if att.thumb == True:
      return send_file(strIO, mimetype='image/jpeg')
   else:
      return send_file('static/img/att_default_thumb.png')
    

