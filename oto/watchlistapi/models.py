from oto import db
from oto.adminapi.models import User

class Show(db.Document):
   tvdbid = db.StringField(required=True)
   owner = db.ReferenceField(User, required=False)
   lastwatched = db.StringField(required=False)
   thumb = db.FileField(required=False)
    
   meta = {
      'indexes': ['tvdbid']
   }
   
class Movie(db.Document):
   tvdbid = db.StringField(required=True)
   owner = db.ReferenceField(User, required=False)
   thumb = db.FileField(required=False)
    
   meta = {
      'indexes': ['tvdbid']
   }
   
class Collection(db.Document):
   owner = db.ReferenceField(User, required=False)
   shows = db.ListField(db.ReferenceField(Show, reverse_delete_rule=4))
   movies = db.ListField(db.ReferenceField(Movie, reverse_delete_rule=4))
   
   meta = {
      'indexes': ['_id']
   }
