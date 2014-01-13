import json
import decimal
import datetime
from bson.dbref import DBRef  # @UnresolvedImport
from bson.objectid import ObjectId  # @UnresolvedImport
from flask import session
from json import dumps

class MongoEncoder(json.JSONEncoder):
   def default(self, value, **kwargs):
      if isinstance(value, ObjectId):
         return unicode(value)
      elif isinstance(value, DBRef):
         return value.id
      if isinstance(value, datetime.datetime):
         return value.isoformat()
      if isinstance(value, datetime.date):
         return value.strftime("%Y-%m-%d")
      if isinstance(value, decimal.Decimal):
         return str(value)
      return super(MongoEncoder, self).default(value, **kwargs)
   
def set_user_cookie(resp):
   if not 'username' in session:
      session['username'] = ''
   if not 'role' in session:
      session['role'] = 'public'
      
   user = {
           'username': session['username'],
           'role': session['role']
           }
   json = dumps(user).replace(',','|')
   resp.set_cookie('user', value=json)
   print resp