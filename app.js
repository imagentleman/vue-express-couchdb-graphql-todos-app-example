// Global credentials
// TODO: Move out of source code

var DB_USER = '';
var DB_PASS = '';
var AUTH = '';

var GITHUB_CLIENT_ID = '';
var GITHUB_CLIENT_SECRET = '';

var SESSION_SECRET = 'hail hydra!';

// CouchDB helper functions

function authenticate(callback) {
  db.auth(DB_USER, DB_PASS, function (error, body, headers) {
    if (headers && headers['set-cookie']) {
      AUTH = headers['set-cookie'];

      db = require('nano')(
        { url : 'http://localhost:5984/todos', cookie: AUTH });
    }

    if (callback) {
      callback();
    }
  });
}

function checkAuth(headers) {
  if (headers && headers['set-cookie']) {
    AUTH = headers['set-cookie'];

    db = require('nano')(
      { url : 'http://localhost:5984/todos', cookie: AUTH });
  }
}

function handleDBResponse(error, body, headers, res) {
  if (error) {
    res.status(error.statusCode);

    return res.send(error.message);
  }

  checkAuth(headers);

  res.status(200);
  res.send(body);
}

// Passport helper functions

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401);
  res.send();
}

// CouchDB setup

var db = require('nano')('http://localhost:5984/todos');

authenticate();

// Github user account setup
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;
// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete GitHub profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new GitHubStrategy(
  {
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      // To keep the example simple, the user's GitHub profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the GitHub account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

// Graphql setup

var {
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} = require('graphql');
var graphqlHTTP = require('express-graphql');
var fetch = require('node-fetch');
var baseUrl = 'http://localhost:3000'

function fetchByPath(relativeURL) {
  return fetch(`${baseUrl}${relativeURL}`).then(res => res.json());
}

function fetchTodos() {
  return fetchByPath('/api/todos').then(json => {
    return json.rows;
  });
}

var TodoType = new GraphQLObjectType({
  name: 'Todo',
  fields: () => ({
    id: { type: GraphQLString },
    todo: {
      type: GraphQLString,
      resolve: todo => todo.doc.todo
    },
    user: {
      type: GraphQLString,
      resolve: todo => todo.doc.user
    }
  })
});

var QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    todos: {
      type: new GraphQLList(TodoType),
      resolve: fetchTodos
    }
  })
});

var schema = new GraphQLSchema({
  query: QueryType
});

// Node Express Server setup

var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');

var app = express();

// Graphql setup

app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true,
}));

// Parse post requests setup

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

// Static files setup

app.use(express.static('public'));

// Github session setup

app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

// API Route Handlers

app.get('/api/todos', function (req, res) {
  db.list({ include_docs: true },
    function(error, body, headers) {
      if (error && error.statusCode === 401) {
        authenticate(function() {
          db.list({ include_docs: true },
            function(error, body, headers) {
              handleDBResponse(error, body, headers, res);
            });
        });
      } else {
        handleDBResponse(error, body, headers, res);
      }
  });
});

app.post('/api/todo', ensureAuthenticated, function (req, res) {
  db.insert(req.body, function(error, body, headers) {
    if (error && error.statusCode === 401) {
      authenticate(function() {
        db.insert(req.body, function(error, body, headers) {
          handleDBResponse(error, body, headers, res);
        });
      });
    } else {
      handleDBResponse(error, body, headers, res);
    }
  })
});

app.get('/api/user', function (req, res) {
  res.status(200);
  res.send({ user: req.user });
});

// Github auth route
app.get('/auth/github',
  passport.authenticate('github', { scope: [ 'user:email' ] }),
  function(req, res){
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
  }
);

// GET /auth/github/callback
// Use passport.authenticate() as route middleware to authenticate the
// request.  If authentication fails, the user will be redirected back to the
// login page.  Otherwise, the primary route function will be called,
// which, in this example, will redirect the user to the home page.
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  }
);

app.get('/logout', function(req, res){
  req.logout();
  req.session.destroy(function () {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// Server init

app.listen(3000, function () {
  console.log('Todos app listening on port 3000!')
});
