'use strict';

const pg = require('pg');

const connectionString = process.env.DATABASE_URL;

const executeQuery = (queryString, cb) => {
  pg.connect(connectionString, (e, client, done) => {
    if(e) return cb(e);
    client.query(queryString, [], (e, result) => {
      done();
      if(e) return cb(e);
      return cb && cb(e);
    })
  });
};

const connect = (cb) => {
  pg.connect(connectionString, cb);
};

module.exports = {
  executeQuery: executeQuery,
  connect: connect
};
