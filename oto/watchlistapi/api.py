from flask import session, make_response, render_template, request
from json import dumps
from pytvdbapi import api
from pytvdbapi.error import ConnectionError, BadData, TVDBIndexError


from oto import app
import oto.settings as settings

tvdb = api.TVDB(settings.TVDBAPIKEY, banners=True)

@app.route('/searchseries', methods = ['GET'])
def searchseries():
   query = request.args.get('query', None)
   if query is not None:
      try:
         result = tvdb.search(query, "en")  # This hits the network and could raise an exception
         #shows = result[0]  # Find the show object that you want
         #shows.update()  # this loads the full data set and could raise exceptions
      except TVDBIndexError:
         # The search did not generate any hits
         return dumps([]), 200
      except ConnectionError:
         # Handle the fact that the server is not responding
         return dumps({'error':'Connection error'}), 500
      except BadData:
         # The server responded but did not provide valid XML data, handle this issue here,
         # maybe by trying again after a few seconds
         return dumps({'error':'Returned data not valid'}), 500
      else:
         # At this point, we should have a valid show instance that we can work with.
         shows = []
         for show in result:
            shows.append(convert(show))
         return dumps(shows), 200
            
      
   else:
      return dumps({'error':'No query string received'}), 500
   
def convert(show):
   show.update()
   showobj = {}
   showobj['name'] = show.SeriesName
   showobj['firstAired'] = str(show.FirstAired)
   showobj['status'] = show.Status
   showobj['totalSeasons'] = 1
   showobj['totalEpisodes'] = 1
   showobj['nextEpisode'] = 'TODO'
   showobj['network'] = show.Network
   showobj['rating'] = show.Rating
   showobj['runtime'] = show.Runtime
   
   try:
      showobj['thumb'] = 'http://thetvdb.com/banners/' + show.banner
   except:
      showobj['thumb'] = 'static/img/conan1.jpg'

   return showobj