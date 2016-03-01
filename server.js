const express = require('express');
const app = express();
const bodyParser = require('body-parser');


const db = require('./db');
const demo = require('./demo');

app.set('port', (process.env.PORT || 5000));

// configure body parser
// parses the data from post request
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static('bower_components'));
app.use(express.static('public'));

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

app.listen(app.get('port'), function () {
  console.log('Listening on port ' + app.get('port') + '!');
  demo.activateDemoMode();
});
