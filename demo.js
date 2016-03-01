/**
 * The demo mode resets the database periodically.
 */

const fs = require('fs');
const path = require('path');

const db = require('./db');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

const wipe = function(){
  db.executeQuery(schema, function(){
    const Pausenverkauf = {
      name: 'Pausenverkauf',
      values: [{
        name: 'Gesunde Ernährung'
      },{
        name: 'Zufriedene Kunden'
      }],
      locations: [{
        coords: {
          latitude: 48.14,
          longitude: 11.6
        }
      }]
    };

    const TanteEmmaLaden = {
      name: 'Tante Emma Laden',
      values: [{
        name: 'Nachhaltigkeit'
      },{
        name: 'Gegenstände für die Ewigkeit'
      }],
      locations: [{
        coords: {
          latitude: 48.15,
          longitude: 11.6
        }
      }]
    };

    db.createCompany(TanteEmmaLaden);
    db.createCompany(Pausenverkauf);
  });
};

module.exports = {
  activateDemoMode: function(delayUntilReset){
    delayUntilReset = delayUntilReset || 15;
    wipe();
    setInterval(wipe, delayUntilReset * 60 * 1000);
  }
};
