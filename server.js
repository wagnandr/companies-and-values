const express = require('express');
const app = express();

const db = require('./db');
const demo = require('./demo');

app.set('port', (process.env.PORT || 5000));

app.use(express.static('bower_components'));
app.use(express.static('public'));

app.listen(app.get('port'), function () {
  console.log('Listening on port ' + app.get('port') + '!');
  demo.activateDemoMode();
});
