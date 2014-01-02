import os
from flask import Flask, Response, session, render_template, send_from_directory, make_response
from flask.ext.mongoengine import MongoEngine  # @UnresolvedImport
from json import dumps
import urllib

app = Flask(__name__)
app.config.from_object('oto.settings')
app.url_map.strict_slashes = False

#Create mongo instance
db = MongoEngine(app)

#import apis
import notesapi.api
from notesapi.customapi import init_notesapp
import adminapi.api

#basic routing to agular app
@app.route('/')
@app.route('/about')
@app.route('/admin')
@app.route('/login')
@app.route('/401')
@app.route('/automation')
def basic_pages(**kwargs):
   resp = make_response(render_template('app.html'))
   set_user_cookie(resp)
   return resp

# special file handlers and error handlers
@app.route('/favicon.ico')
def favicon():
   return send_from_directory(os.path.join(app.root_path, 'static'),
                        'img/favicon.ico')

@app.errorhandler(404)
def page_not_found(e):
   return make_response(render_template('app.html')), 404

'''
@app.errorhandler(401)
def not_authorized(e):
   print 'FORBIDDDDD'
   return make_response(render_template('app.html')), 401
'''

'''
@app.before_request
def before_request():
   pass
'''

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


#routes which need specific decorators
'''
Notes
'''
@app.route('/notes')
@init_notesapp
def notes_module(**kwargs):
   resp = make_response(render_template('app.html'))
   return resp