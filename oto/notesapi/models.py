from datetime import datetime

from oto import db
from oto.adminapi.models import User

class Stack(db.Document):
   createdat = db.DateTimeField(required=True)
   title = db.StringField(verbose_name="Title", max_length=255, required=True, unique_with='owner')
   color = db.StringField(max_length=6, required=False)
   owner = db.ReferenceField(User, required=True)
   

   def __unicode__(self):
      return self.title

   meta = {
      'allow_inheritance': True,
      'indexes': ['-createdat', {'fields': ('title', 'owner'), 'unique': True}],
      'ordering': ['-createdat']
   }

class FileAttachment(db.Document):
   filename = db.StringField(required=True)
   mimetype = db.DynamicField(required=False)
   file = db.FileField(required=True)
   thumb = db.BooleanField(default=False, required=True)
   thumbfile = db.FileField(required=False)
   cardid = db.StringField(required=False)
   position = db.IntField(required=False)
   #i know its not great that the att knows about the card, 
   #but I use this to create thumbs in the background and assign to correct card on finish
   #also when saving a new card I retrive dangling atts and add them to the card
    
   meta = {
      'indexes': ['_id']
   }
   
class UrlAttachment(db.Document):
   url = db.StringField(required=True)
   thumb = db.BooleanField(default=False, required=True)
   thumbfile = db.FileField(required=False)
    
   meta = {
      'indexes': ['_id']
   }

class Card(db.Document):
   stackid = db.ObjectIdField(required=True)
        
   title = db.StringField(verbose_name="Title", max_length=255, required=True)
   content = db.StringField(verbose_name="Content", required=False)
    
   createdat = db.DateTimeField(default=datetime.now().strftime('%Y%m%d%H%M%S'), required=True)
   modifiedat = db.DateTimeField(default=datetime.now().strftime('%Y%m%d%H%M%S'), required=False) #we need a default date for correct sorting on sortby modified_at
   archivedat = db.DateTimeField(default=None,required=False)
   stacktitleafterarchived = db.StringField(max_length=255, required=False)
   duedate = db.DateTimeField(default=None, required=False)
    
   owner = db.ReferenceField(User, required=True)
   fileattachments = db.ListField(db.ReferenceField(FileAttachment, reverse_delete_rule=4))
   urlattachments = db.ListField(db.ReferenceField(UrlAttachment, reverse_delete_rule=4))
    
   meta = {
      'allow_inheritance': True,
      'indexes': ['-createdat', 'id', '-modifiedat', 'title']
   }