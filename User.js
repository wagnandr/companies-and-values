'use strict';

const credential = require('credential');
let pw = credential();

const db = require('./db');

/**
 * If we test the application, sometimes calculating the credentials is too much.
 * This function lessens the work burden.
 */
const setToTestMode = () => {
  pw = credential({work: 0});
}

const encryptPassword = (password, cb) => {
  pw.hash(password, function (err, hash) {
    cb(err, hash);
  });
};

const verifyPassword = (storedPasswordHash, cleartextPassword, cb) => {
  pw.verify(storedPasswordHash, cleartextPassword, function (err, isValid) {
    cb(err, isValid);
  });
};

const findByUsername = (username, cb) => {
  db.connect((err, client, done) => {
    client.query('select * from localuser where name=$1', [username], (err, result) => {
      done();
      if(err) return cb(err);
      cb(err, result.rows[0]);
    });
  });
};

const findById = (id, cb) => {
  db.connect((err, client, done) => {
    client.query('select * from localuser where id=$1', [id], (err, result) => {
      done();
      if(err) return cb(err);
      cb(err, result.rows[0]);
    });
  });
};

const create = (username, password, cb) => {
  encryptPassword(password, (err, passwordHash) => {
    if(err) return cb(err);
    db.connect((err, client, done) => {
      if(err) { done(); return cb(err)};
      client.query('insert into localuser (name, password) values ($1, $2) returning id',
        [username, passwordHash], (err, result) => {
          done();
          if(err) return cb(err);
          const id = result.rows[0].id;
          cb(err, {
            id: id,
            name: username,
            password: passwordHash
          });
      });
    });
  });
};

module.exports = {
    findByUsername,
    findById,
    create,
    encryptPassword,
    verifyPassword,
    setToTestMode
};
