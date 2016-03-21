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
    name: 'CompanyA',
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
        assert(_.every(company.locations, (l) => _.isNumber(l.id)), 'valid locations');
        assert(_.every(company.values, (v) => _.isNumber(v.id)), 'valid values');
        done();
      });
    });
  });

  describe('findById', () => {
    it('should return the company with its locations and values', (done) => {
      Company.create(CompanyA, testUser1, (e, company) => {
        Company.findById(company.id, (e, foundCompany) => {
          assert(!e, 'no error');
          assert.equal(foundCompany.id, company.id, 'valid id');
          assert.equal(foundCompany.locations.length, CompanyA.locations.length, 'locations found');
          assert.equal(foundCompany.values.length, CompanyA.values.length, 'values found');
          done();
        });
      });
    });
  });

  describe('delete', () => {
    it('should delete the company', (done) => {
      Company.create(CompanyA, testUser1, (e, company) => {
        assert(!e, 'no creating');
        Company.delete(company, (e) => {
          assert(!e, 'no error');
          Company.findById(company.id, (e, foundCompany) => {
            assert(!e, 'no error finding');
            assert(!foundCompany);
            done();
          });
        });
      });
    });
  });

  describe('update', ()=> {
    const companyToModifyBlueprint = CompanyA;
    let companyToModify;

    beforeEach((done) => {
      Company.create(_.clone(companyToModifyBlueprint), testUser1, (e, company) => {
        assert(!e);
        companyToModify = company;
        done();
      });
    });

    afterEach((done) => {
      Company.delete(companyToModify, done);
    });

    it('should update the company name', (done) => {
        const CompanyAModified = _.clone(companyToModifyBlueprint);
        const modifiedName = CompanyAModified.name = 'modifiedA'
        Company.update(CompanyAModified, testUser1, (e, company) => {
          Company.findById(company.id, (e, foundCompany) => {
            assert.equal(foundCompany.name, modifiedName, 'modified name correct');
            done();
          });
        });
    });

    it('should update existing locations', (done) => {
        const modification = _.clone(companyToModify);
        modification.locations[0].coords.latitude = 333;
        const modifiedLocation = modification.locations[0];
        Company.update(modification, testUser1, (e, company) => {
          assert(!e, 'no error updating')
          Company.findById(modification.id, (e, foundCompany) => {
            assert(!e, 'no finding')
            assert(_.some(foundCompany.locations, (location) => {
              return (location.id == modifiedLocation.id) && (location.coords.latitude == 333);
            }), 'location was modified');
            done();
          });
        });
    });

    it('should update existing values', (done) => {
        const modification = _.clone(companyToModify);
        modification.values[0].name = 'modified value';
        const modifiedValue = modification.values[0];
        Company.update(modification, testUser1, (e, company) => {
          assert(!e, 'no error updating')
          Company.findById(modification.id, (e, foundCompany) => {
            assert(!e, 'no finding')
            assert(_.some(foundCompany.values, (value) => {
              return (value.id == modifiedValue.id) && (value.name == 'modified value');
            }), 'value was modified');
            done();
          });
        });
    });

    it('should insert new values', (done) => {
        const modification = _.clone(companyToModify);
        modification.values.push({ name: 'new value' });
        Company.update(modification, testUser1, (e, company) => {
          assert(!e, 'no error updating')
          Company.findById(modification.id, (e, foundCompany) => {
            assert(!e, 'no finding')
            assert(_.some(foundCompany.values, (value) => {
              return (value.name == 'new value') && _.isNumber(value.id);
            }), 'value was inserted');
            done();
          });
        });
    });

    it('should insert new locations', (done) => {
        const modification = _.clone(companyToModify);
        modification.locations.push({ coords: {latitude: 33, longitude: 44}});
        Company.update(modification, testUser1, (e, company) => {
          assert(!e, 'no error updating')
          Company.findById(modification.id, (e, foundCompany) => {
            assert(!e, 'no finding')
            assert(_.some(foundCompany.locations, (location) => {
              return (location.coords.latitude == 33) &&
                     (location.coords.longitude == 44) &&
                     _.isNumber(location.id);
            }), 'location was inserted');
            done();
          });
        });
    });

    it('should return an error if another user changes the company', (done) => {
        const CompanyAModified = _.clone(companyToModifyBlueprint);
        const modifiedName = CompanyAModified.name = 'modifiedA'
        Company.update(CompanyAModified, testUser2, (e, company) => {
          assert(e, 'returns error');
          done();
        });
    });

    it('should return an error if another user steals locations');

    it('should return an error if another user steals values');

  });
});
