from flask import request, send_file
import mimetypes
import json
from datetime import datetime
import StringIO
import os
from subprocess import call

from models import Card, UrlAttachment


def saveLinkToMongo():
   data = request.json
   att = json.loads(data['att'])
   url = att['url']
   positionInUi = att['position']
   cwd = os.path.dirname(os.path.realpath(__file__))
   
   cardid = data['cardid']
    
   urlAttachment = UrlAttachment(url=url)

   try:
      #Create thumbnail
      filename = 'url.jpg'
      programdir = os.path.dirname(os.path.dirname(cwd)) + '/external/'
      
      command = "phantomjs " + programdir + "rasterize.js '" + url + "' '/var/tmp/url.jpg'"
      print command
      call(command, shell=True)
        
      #save thumbnail to gridfs
      with open('/var/tmp/' + filename, 'r') as fileobject:
         urlAttachment.thumbfile.put(fileobject, content_type = mimetypes.guess_type(filename)[0])
        
      #remove from filesystem
      os.remove('/var/tmp/' + filename)
    
      urlAttachment.thumb = True
        
   except:
      pass
    
   urlAttachment.save()
    
   #add to card
   if cardid != 'new':
      #TODO: check if card exists. No multiple users per card yet
      card = Card.objects.get_or_404(id=cardid)  # @UndefinedVariable
      card.urlattachments.append(urlAttachment)
      card.modifiedat = datetime.now().strftime('%Y%m%d%H%M%S')
      card.save()
    
   #prepare response
   tosend = {}
   tosend['id'] = str(urlAttachment.id)
   tosend['url'] = urlAttachment.url
   tosend['positionInUi'] = positionInUi
   
   return json.dumps(tosend)
    
def serve_urlattachment_thumbnail(urlattachmentid):
   urlAttachment = UrlAttachment.objects.get_or_404(id=urlattachmentid)  # @UndefinedVariable
    
   strIO = StringIO.StringIO()
   strIO.write(urlAttachment.thumbfile.read())
   strIO.seek(0)
    
   if urlAttachment.thumb == True:
      return send_file(strIO, mimetype='image/jpeg')
   else:
      return send_file('static/img/att_default_thumb.png')
    
    
def deleteurlattachment():
   urlattachmentids = json.loads(request.form['array'])
   cardid = request.form['cardid']
   if 'changeMofidiedat' in request.form:
      changeMofidiedat = request.form['changeMofidiedat']
      #we do not change it for example whan canceling a card edit
   else:
      changeMofidiedat = True
    
   for urlattachmentid in urlattachmentids:
      urlAttachment = UrlAttachment.objects.get_or_404(id=urlattachmentid)  # @UndefinedVariable
      #TODO: check if exists
      urlAttachment.thumbfile.delete()
      urlAttachment.delete()
      
      if cardid != 'new':
         card = Card.objects.get_or_404(id=cardid)  # @UndefinedVariable
         if changeMofidiedat == True:
            card.modifiedat = datetime.now().strftime('%Y%m%d%H%M%S')
         card.save()
    
   return 'ok'