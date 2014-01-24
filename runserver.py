import os
from oto import app

def runserver():
   port = int(os.environ.get('PORT', 5000))
   app.run(host='0.0.0.0', port=port)

if __name__ == '__main__':
   #runserver()
   from gevent import pywsgi
   from geventwebsocket.handler import WebSocketHandler
   server = pywsgi.WSGIServer(('', 5000), app, handler_class=WebSocketHandler)
   server.serve_forever()
