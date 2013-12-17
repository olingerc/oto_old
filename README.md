# OrganizeTheOlingers

### Starting point was: https://github.com/rxl/angular-flask
### but then I decided to use flask only as json provider (and special api calls)
### I then went with the modularity approach in http://cliffmeyers.com/blog/2013/4/21/code-organization-angularjs-javascript

1. python runserver.py
2. the original author had a manage step to create the db: python manage.py create_db && python manage.py seed_db --seedfile 'data/db_items.json'



#Authentication
The api calls are secured on the server side using the flask sessions
As soon as angular gets a 401 from an api call, it redirects to login
Routing is secured via angular only. i used
http://www.frederiknakstad.com/authentication-in-single-page-applications-with-angular-js/

server: adminapi api.py and auth.py , client detects this using an interceptor in app.js
client: routingConfig.js

#404 and 401
Handled by flask

