const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;


const db = require('./db');
const User = require('./User');
const demo = require('./demo');

app.set('port', (process.env.PORT || 5000));

// authentication
passport.use(new LocalStrategy(
  (username, password, done) => {
    User.findByUsername(username, (e, user) => {
      if(e)
        return done(e);
      if(!user)
         return done(null, false, {message: 'incorrect user'});
      User.verifyPassword(user.password, password, (e, isValid) => {
        if(e) throw e;
        if(!isValid)
           return done(null, false, {message: 'incorrect password'});
        return done(null, user);
      });
    });
  }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// configure body parser
// parses the data from post request
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// configure authentication
app.use(session({ secret: 'TODO:Something secret' }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static('bower_components'));
app.use(express.static('public'));

app.get('/isloggedin', (req, res) => {
  res.send(req.isAuthenticated() ? req.user : '0');
});

app.post('/login',
  passport.authenticate('local'),
  (req, res) => {
    res.json(req.user);
});

app.post('/logout', function(req, res){
  req.logOut(); res.send(200);
});


app.get('/api/company/listall', function(req, res){
  db.getAllCompanies(function(companies){
    res.json(companies);
  }, function(err){
    res.json({status: 'error', error: err})
  })
});

app.post('/api/company/create', function(req, res){
  db.createCompany(req.body, function(){
    res.json({status: 'success'});
  }, function(err){
    res.json({status: 'error', error: err});
  })
});

app.post('/api/company/update', function(req, res){
  db.updateCompany(req.body, function(){
    res.json({status: 'success'});
  }, function(err){
    res.json({status: 'error', error: err});
  })
});

app.get('/api/location/listall', function(req, res){
  db.getAllLocations(function(locations){
    res.json({status: 'success', locations: locations});
  });
});

app.get('/api/company/:id', function(req, res){
  db.getCompany(req.params.id, function(company){
    res.json({status: 'success', company: company[0]});
  });
});

app.listen(app.get('port'), function () {
  console.log('Listening on port ' + app.get('port') + '!');
  demo.activateDemoMode();
});
