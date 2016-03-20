'use strict';

const assert = require('assert');
const User = require('./../User');
const wipe = require('./../demo').wipe;

describe('Users', function (){
  before((done) => {
    User.setToTestMode();
    wipe(done);
  });

  describe('create', () => {
    it('should return a user with a valid id', function (done) {
      const username = 'Alice';
      const password = 'alice123';
      User.create(username, password, (e, user) => {
        assert(user.id, 'should have returned an id');
        assert.equal(user.name, username, 'should have a username');
        assert(user.password, 'should have a hashed password');
        done();
      });
    });

    it('can be created just once', function (done) {
      const username = 'Bill';
      const password = 'bill123';
      User.create(username, password, (e, user) => {
        assert(user.id, 'should have returned an id');
        User.create(username, password, (e, user) => {
          assert(e, 'should have returned an error');
          done();
        });
      })
    });

    after(wipe);
  });

  describe('findById', () => {
    let id = null;
    const username = 'TEmma';
    const password = 'te123';

    before((done) => {
      User.create(username, password, (e, user) => {
        id = user.id;
        done();
      });
    });

    it('should return a user if it is in the database', (done) => {
      User.findById(id, (e, user) => {
        assert(!e, 'no error');
        assert.equal(user.name, username, 'valid username');
        done();
      });
    });

    it('should return null if the user id is invalid', (done) => {
      const invalidId = id + 42;
      User.findById(invalidId, (e, user) => {
        assert(!e, 'no error');
        assert(!user, 'no user');
        done();
      });
    });
  });

  describe('findByUsername', () => {
    const username = 'TEmma';
    const password = 'te123';

    before((done) => {
      User.create(username, password, (e, user) => {
        done();
      });
    });

    it('should return a user if it is in the database', (done) => {
      User.findByUsername(username, (e, user) => {
        assert(!e, 'no error');
        assert.equal(user.name, username, 'valid username');
        done();
      });
    });

    it('should return null if the no user with the name is present', (done) => {
      const invalidUsername = 'invalid';
      User.findByUsername(invalidUsername, (e, user) => {
        assert(!e, 'no error');
        assert(!user, 'no user');
        done();
      });
    });
  });
});
