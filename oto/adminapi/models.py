from oto import db

class User (db.Document):
   username = db.StringField(max_length=255, required=True)
   name = db.StringField(required=True)
   password = db.StringField(required=True)
   role = db.StringField(default='user', required=True)
   
   meta = {
      'indexes': [
                  {'fields': ['username'], 'unique': True}
               ]
   }
   
class Rememberme (db.Document):
   username = db.StringField(max_length=255, required=True)
   hash = db.StringField(required=True)
   valid = db.BooleanField(default=False, required=True)
   
   meta = {
      'indexes': [
                  {'fields': ['hash'], 'unique': True}
               ]
   }