'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;


const User = require('./User');
const Company = require('./Company');
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

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
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

app.post('/logout', (req, res) => {
  req.logOut();
  res.send(200);
});


app.get('/api/company/listall', (req, res) => {
  Company.findAll((err, companies) => {
    if(err){
      console.log(err)
      return res.status(500).json({status: 'error', error: err})
    }
    res.json(companies);
  })
});

app.post('/api/company/create', (req, res) => {
  Company.create(req.body, (err) => {
    if(err){
      console.log(err)
      return res.status(500).json({status: 'error', error: err})
    }
    res.json({status: 'success'});
  });
});

app.post('/api/company/update', (req, res) => {
  Company.update(req.body, (err) => {
    if(err){
      console.log(err)
      return res.status(500).json({status: 'error', error: err})
    }
    res.json({status: 'success'});
  });
});

app.get('/api/location/listall', (req, res) => {
  Company.findAllLocations((err, locations) => {
    if(err){
      console.log(err)
      return res.status(500).json({status: 'error', error: err})
    }
    res.json({status: 'success', locations: locations});
  });
});

app.get('/api/company/:id', (req, res) => {
  Company.findById(req.params.id, (err, company) => {
    if(err){
      console.log(err)
      return res.status(500).json({status: 'error', error: err})
    }
    res.json({status: 'success', company: company[0]});
  });
});

app.listen(app.get('port'), () => {
  console.log('Listening on port ' + app.get('port') + '!');
  demo.activateDemoMode();
});
