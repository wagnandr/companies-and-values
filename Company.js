'use strict';

const _ = require('lodash');
const doAsync = require('async');

const db = require('./db');

const collectErrorsAndResults = (cb) => {
  let error;
  let results = [];
  return (e, result) => {
    if(e) error = e;
    if(result) results.push(result);
    return cb(error, results);
  };
};

const companyRowsToJson = (companyRows) => {
  let companies = {};
  _.each(companyRows, function(row){
    if(!companies[row.id])
      companies[row.id] = { id: row.id, name: row.name, values: {}, locations: {} };
    if(!companies[row.id].values[row.vid])
      companies[row.id].values[row.vid] = {id: row.vid, name: row.value};
    if(!companies[row.id].locations[row.lid])
      companies[row.id].locations[row.lid] = {id: row.lid, coords: { latitude: row.latitude, longitude: row.longitude}};
  });

  return _.map(companies, function(company){
    company.locations = _.map(company.locations, function(location){ return location; });
    company.values = _.map(company.values, function(value){ return value; });
    return company;
  });
};

const findAllCompanies = (cb) => {
  db.connect((e, client, done) => {
    if(e) return cb(e)
    const queryString =
      'select c.id as id, c.name, l.id as lid, l.latitude, l.longitude, v.id as vid, v.name as value ' +
      'from company c, location l, value v '+
      'where c.id = l.company_id and c.id = v.company_id';
    client.query(queryString, [], function(e, result) {
      done();
      if(e) return cb(e);
      return cb(e, companyRowsToJson(result.rows));
    });
  });
};

const findCompanyById = (id, cb) => {
  db.connect((e, client, done) => {
    if(e) return cb(e);
    const queryString =
      'select c.id as id, c.name, l.id as lid, l.latitude, l.longitude, v.id as vid, v.name as value ' +
      'from company c, location l, value v '+
      'where c.id = l.company_id and c.id = v.company_id and c.id = $1';
    client.query(queryString, [id], (e, result) => {
      done();
      if(e) return cb(e);
      return cb(e, companyRowsToJson(result.rows));
    });
  });
};

const locationRowToJson = (row) => {
  return {
    id: row.id,
    company_id: row.company_id,
    coords: {
      latitude: row.latitude,
      longitude: row.longitude
    }
  };
};

const findAllLocations = (cb) => {
  db.connect((e, client, done) => {
    if(e) return cb(e);
    const queryString = 'select * from location'
    client.query(queryString, [], function(e, result) {
      done();
      if(e) return cb(e);
      return cb(e, _.map(result.rows, locationRowToJson));
    });
  });
};

const isUserAllowedToModifyCompany = (client, user, company_id, cb) => {
  const q = `select c.id from company c, localuser u
    where u.id = c.creator_id and c.id = $1 and c.creator_id = $2`;
  client.query(q, [company_id, user.id], function(e, result) {
    if(e) return cb(e);
    return cb(e, result.rows.length != 0);
  });
};

const insertValue = (client, company_id, value, cb) => {
  const insertValueString = 'insert into value (name, company_id) values ($1, $2) returning id'
  client.query(insertValueString, [value.name, company_id], (e, result) => {
    if(e) return cb(e);
    value.id = result.rows[0];
    value.company_id = company_id;
    return cb(e, value);
  });
};

const insertLocation = (client, company_id, location, cb) => {
  const insertLocationString = 'insert into location (latitude, longitude, company_id) values ($1, $2, $3) returning id'
  client.query(insertLocationString, [location.coords.latitude, location.coords.longitude, company_id], (e, result) => {
    if(e) return cb(e);
    location.id = result.rows[0];
    location.company_id = company_id;
    return cb(e, location);
  });
};

const createCompany = (company, user, cb) => {
  db.connect((e, client, done) => {
    if(e) return cb(e);
    client.query('insert into company (name, creator_id) values ($1, $2) returning id', [company.name, user.id], function(e, result){
      if(e) return cb(e);
      const id = company.id = result.rows[0].id;

      const afterInsertion = collectErrorsAndResults(
        _.after(company.values.length + company.locations.length, (e, results) => {
          done();
          if(e) return cb(e);
          return cb && cb(e);
      }));

      _.each(company.values, function(value){
        insertValue(client, id, value, afterInsertion);
      });

      _.each(company.locations, function(location){
        insertLocation(client, id, location, afterInsertion);
      });
    });
  });
};

const updateValue = (client, value, cb) => {
    client.query('update value set name = $1 where id = $2', [value.name, value.id], (e, result) => {
      if(e) return cb(e);
      return cb(e, result);
    });
};

const isUserAllowedToModifyValue = (client, user, value_id, cb) => {
  const q = `select v.id from value v, company c, localuser u
    where v.company_id = c.id and u.id = c.creator_id and v.id = $1 and u.id = $2`;
  client.query(q, [value_id, user.id], function(e, result) {
    if(e) return cb(e);
    return cb(e, result.rows.length != 0);
  });
};

const updateValueSafe = (client, user, company, value, cb) => {
  if(!value.id)
    return insertValue(client, company.id, value, cb);

  isUserAllowedToModifyValue(client, user, value.id, (e, permitted) => {
    if(e) return cb(e);
    if(!permitted) return cb({
      type: 'error',
      message: 'user not allowed to update value',
      user: user,
      value: value
    });
    return updateValue(client, value, cb);
  });
};

const updateValuesSafe = (client, user, company, valueList, cb) => {
  doAsync.map(valueList, _.curry(updateValueSafe)(client, user, company), cb);
};

const updateLocation = (client, location, cb) => {
    client.query('update location set latitude = $1, longitude = $2 where id = $3', [location.coords.latitude, location.coords.longitude, location.id], (e, result) => {
      if(e) return cb(e);
      return cb(e, result);
    });
};

const isUserAllowedToModifyLocation = (client, user, location_id, cb) => {
  const q = `select l.id from location l, company c, localuser u
    where l.company_id = c.id and u.id = c.creator_id and l.id = $1 and u.id = $2`;
  client.query(q, [location_id, user.id], function(e, result) {
    if(e) return cb(e);
    return cb(e, result.rows.length != 0);
  });
};

const updateLocationSafe = (client, user, company, location, cb) => {
  if(!location.id)
    return insertLocation(client, company.id, location, cb);

  isUserAllowedToModifyLocation(client, user, location.id, (e, permitted) => {
    if(e) return cb(e);
    if(!permitted) return cb({
      type: 'error',
      message: 'user not allowed to update location',
      user: user,
      location: location
    });
    return updateLocation(client, location, cb);
  });
};

const updateLocationsSafe = (client, user, company, locationList, cb) => {
  doAsync.map(locationList, _.curry(updateLocationSafe)(client, user, company), cb);
};

const updateLocationsAndValuesSafe = (client, user, company, locationList, valueList, cb) => {
  doAsync.parallel([
    _.curry(updateLocationsSafe)(client, user, company, locationList),
    _.curry(updateValuesSafe)(client, user, company, valueList)
  ], cb);
};

const updateCompany = (company, user, cb) => {
  db.connect((e, client, done) => {
    if(e) { done(); return cb(e); }
    isUserAllowedToModifyCompany(client, user, company.id, (e, permitted) => {
      client.query('update company set name = $1 where id = $2', [company.name, company.id], (e, result) => {
        if(e) { done(); return cb(e); }
        updateLocationsAndValuesSafe(client, user, company, company.locations, company.values, (e, results) => {
          done();
          if(e) return cb(e);
          return cb && cb(e, results);
        });
      });
    });
  });
};

const deleteCompany = (company, cb) => {
  db.connect((e, client, done) => {
    if(e) return cb(e);
    client.query('delete from company where id = $1', [company.id], (e, result) => {
      done();
      if(e) return cb(e);
      return cb && cb();
    });
  });
};

module.exports = {
  delete: deleteCompany,
  update: updateCompany,
  create: createCompany,
  findAll: findAllCompanies,
  findById: findCompanyById,
  findAllLocations: findAllLocations
};
