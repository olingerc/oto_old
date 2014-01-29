import os
from flask import Flask, Response, session, render_template, send_from_directory, make_response, g
from flask.ext.mongoengine import MongoEngine  # @UnresolvedImport
from json import dumps
import urllib

from utils import set_user_cookie

app = Flask(__name__)
app.config.from_object('oto.settings')
app.url_map.strict_slashes = False

#Create mongo instance
db = MongoEngine(app)

#import apis
import notesapi.api
from notesapi.customapi import init_notesapp
import adminapi.api
from adminapi.api import requires_auth_route
import watchlistapi.api

#basic routing to agular app
@app.route('/')
@app.route('/about')
@app.route('/admin')
@app.route('/login')
@app.route('/401')
@app.route('/automation')
@app.route('/watchlist')
@requires_auth_route
def basic_pages(**kwargs):
   resp = make_response(render_template('app.html'))
   set_user_cookie(resp)
   if hasattr(g, 'rm_cookie'):
      #the user received a new 'rememberme' cookie from requires_auth_route TODO: should not be here but in api, but I do not
      #have access to response there. flask has deferred callback way for that usecase but I do not understand it
      rm = g.get('rm_cookie')
      resp.set_cookie('oto_rememberme', value=rm.username + "_" + rm.hash, max_age=432000)
   return resp

@app.route('/notes')
@requires_auth_route
@init_notesapp
def notes_module(**kwargs):
   resp = make_response(render_template('app.html'))
   set_user_cookie(resp)
   print str(hasattr(g, 'new_rm_cookie'))
   
   if hasattr(g, 'new_rm_cookie'):
      #the user received a new 'rememberme' cookie from requires_auth_route TODO: should not be here but in api, but I do not
      #have access to response there. flask has deferred callback way for that usecase but I do not understand it
      rm = g.get('new_rm_cookie')
      resp.set_cookie('oto_rememberme', value=rm.username + "_" + rm.hash, max_age=432000)
   return resp


# special file handlers and error handlers
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


@app.route('/favicon.ico')
def favicon():
   return send_from_directory(os.path.join(app.root_path, 'static'),
                        'img/favicon.ico')

@app.errorhandler(404)
def page_not_found(e):
   return make_response(render_template('app.html')), 404