from flask import request, send_file
from json import dumps
from pytvdbapi import api
from pytvdbapi.error import ConnectionError, BadData, TVDBIndexError
import urllib
from os.path import exists

from mongoengine.queryset import DoesNotExist
from collections import OrderedDict


from oto import app
from oto.watchlistapi.models import *
import oto.settings as settings
import datetime

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
   
@app.route('/seriesthumb/<thumb>', methods = ['GET'])
def getfile(thumb):
   return send_file('/var/tmp/' + thumb + ".jpg")

@app.route('/addseries', methods = ['POST'])
def addseries():
   show = request.json['show']
   try:
      collection = Collection.objects.get(owner=None)
   except DoesNotExist:
      collection = Collection(owner=None)
      
   newshow = Show(tvdbid=str(show['id']))
   newshow.save()
   collection.shows.append(newshow)
   collection.save()
   return dumps(show), 201

@app.route('/getseries', methods = ['GET'])
def getseries():
   try:
      collection = Collection.objects.get(owner=None)
   except DoesNotExist:
      collection = Collection(owner=None, shows=[])
      collection.save()
   except:
      raise
      
   showsarray = []
   shows = collection['shows']
   for show in shows:
      try:
         thisshow = tvdb.get_series(show['tvdbid'], 'en', True)
         thisshow.update()
      except:
         raise
      else:
         showobj = convert(thisshow)
         showsarray.append(showobj)
   return dumps(showsarray), 200

def convert(show):
   show.update()
   showobj = {}
   showobj['name'] = show.SeriesName
   showobj['firstAired'] = str(show.FirstAired)
   showobj['status'] = show.Status
   showobj['totalSeasons'] = getTotalSeasons(show)
   showobj['totalEpisodes'] = getTotalEpisodes(show)
   showobj['network'] = show.Network
   showobj['rating'] = show.Rating
   showobj['runtime'] = show.Runtime
   showobj['id'] = show.id
   showobj = episodelist_next(show, showobj) #puts in list and next aired, avoids parsing all episodes twice
   
   try:
      #Get available data
      series = [b for b in show.banner_objects if b.BannerType == "series"]
      posters = [b for b in show.banner_objects if b.BannerType == "poster"]
      fanart = [b for b in show.banner_objects if b.BannerType == "fanart"]
      
      #Search most appropriate
      foundthumb = False
      if len (series) > 0:
         filename = series[0].BannerPath
         tvdburl = series[0].banner_url
         foundthumb = True
      elif len(posters) > 0:
         filename = posters[0].BannerPath
         tvdburl = posters[0].banner_url
         foundthumb = True
      elif len(fanart) > 0:
         filename = fanart[0].BannerPath
         tvdburl = fanart[0].banner_url
         foundthumb = True
      else:
         foundthumb = False
         
      if foundthumb == False:
         #No thumb on tvdb
         showobj['thumb'] = '/static/img/att_default_thumb.png'
      else:
         #Get from tvdb if we do not have it yet in var/temp
         if not exists("/var/tmp/" + filename):
            urllib.urlretrieve(tvdburl, "/var/tmp/" + str(show.SeriesID) + ".jpg")
         
         showobj['thumb'] = "/seriesthumb/" + str(show.SeriesID)
   except:
      raise
      showobj['thumb'] = '/static/img/att_default_thumb.png'

   return showobj

def getTotalSeasons(show):
   total = len(show)
   try:
      specials = show[0].season_number
      total = total -1
   except TVDBIndexError:
      #the show has no specials
      pass
   return total

def getTotalEpisodes(show):
   total = 0
   for season in show[1:]:
      total = total + len(season)
   
   return total

def episodelist_next(show, showobj):
   now = datetime.datetime.now().strftime('%Y-%m-%d')
   found = False
   nextaired = None
   episodelist = []

   for season in show:
      for episode in season:
         if str(episode.FirstAired) >= now and found != True:
            nextaired = str(episode.FirstAired) + ", " + 'S' + str(season.season_number) + "E" + str(episode.EpisodeNumber)
            found = True
         episodelist.append('S' + str(season.season_number) + "E" + str(episode.EpisodeNumber) + " " + str(episode.FirstAired) + " " + episode.EpisodeName)
         
   showobj['episodelist'] = episodelist
   showobj['nextEpisode'] = nextaired
   return showobj

   