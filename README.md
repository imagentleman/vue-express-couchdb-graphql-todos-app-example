# vue-express-couchdb-todos-app-example
Example todos app with Vue.js, Express (with Passport and Github login) and CouchDB (with Nano).

The todos app will allow people to login using their Github credentials and create and save todos on a CouchDB database.

## Pre-requisites

* CouchDB 2.0 (installation instructions [here](http://docs.couchdb.org/en/2.0.0/install/index.html)).
* Node 7+ (installation instructions [here](https://nodejs.org/en/download/)).
* Yarn 0.19+ (installation instructions [here](https://yarnpkg.com/en/docs/install)).

### CouchDB Setup

1. Create a database named ```todos```.
2. Add a member with some credentials for authentication and replace ```DB_USER``` and ```DB_PASS``` on app.js with the correct values.
3. On Github go to https://github.com/settings/applications/new and create a new application with ```http://localhost:3000/auth/github/callback``` as the ```Authorization Callback URL```. Replace ```GITHUB_CLIENT_ID``` and ```GITHUB_CLIENT_SECRET``` on app.js with the correct values (that github provides after creating the application).

## Usage

1. Clone this repo.
2. From the root and using the command line run ```yarn``` to install the node dependencies (express, passport, nano, etc).
3. Then, run express with ```node app```.
4. Visit the website on ```http://localhost:3000```.
5. Relax.

## References

* https://vuejs.org/v2/guide/
* http://docs.couchdb.org/en/2.0.0/contents.html
* https://github.com/dscape/nano
* http://github.com/cfsghost/passport-github
