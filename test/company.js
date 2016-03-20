'use strict';

const assert = require('assert');
const User = require('./../User');
const Company = require('./../Company');
const wipe = require('./../demo').wipe;
const _ = require('lodash');

describe('Company', function (){
  let testUser1;
  let testUser2;

  const bareCompany = {
    name: 'A bare company',
    locations: [],
    values: []
  };

  const CompanyA = {
    name: 'A bare company',
    locations: [{
      coords: {
        latitude: 42,
        longitude: 43
      }
    }, {
      coords: {
        latitude: 32,
        longitude: 33
      }
    }],
    values: [
      { name: 'CA value1' },
      { name: 'CA value2' },
      { name: 'CA value3' },
    ]
  };

  beforeEach((done) => {
    User.setToTestMode();
    wipe(() => {
      User.create('user1', 'pwuser1', (e, user) => {
        testUser1 = user;
        User.create('user2', 'pwuser2', (e, user) => {
          testUser2 = user;
          done();
        });
      });
    });
  });

  describe('create', () => {
    it('should create a bare company with valid id', (done) => {
      Company.create(bareCompany, testUser1, (e, company) => {
        assert(!e, 'no error');
        assert(company.id, 'valid id');
        done();
      });
    });

    it('should recursively insert locations and values', (done) => {
      Company.create(CompanyA, testUser1, (e, company) => {
        assert(!e, 'no error');
        assert(company.id, 'valid id');
        assert.equal(CompanyA.locations.length, company.locations.length, 'locations same size');
        assert.equal(CompanyA.values.length, company.values.length, 'values same size');
        console.log(company.locations);
        assert(_.every(company.locations, (l) => _.isNumber(l.id)), 'valid locations');
        assert(_.every(company.values, (v) => _.isNumber(v.id)), 'valid values');
        done();
      });
    });
  });
});
