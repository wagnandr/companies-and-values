'use strict';

angular.module('valuesMain', [
  'ngRoute',
  'uiGmapgoogle-maps',
  'ui.bootstrap'
]).config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when('/show-map', {
      templateUrl: 'show-map.html',
      controller: 'ShowMapCtrl'
    }).
    when('/add-company', {
      templateUrl: 'add-company.html',
      controller: 'AddCompanyCtrl'
    }).
    when('/list-and-edit-companies', {
      templateUrl: 'list-and-edit-companies.html',
      controller: 'ListAndEditCompaniesCtrl'
    }).
    otherwise({
      redirectTo: '/show-map'
    });
}]).controller('ShowMapCtrl', function ($scope, Locations, Companies, locationsToMarkers, Constants){
  const munich = { latitude: 48.14, longitude: 11.6 };

  $scope.map = { center: munich, zoom: 12 };

  Locations.getAll().then((list) => {
    locationsToMarkers(list);
    $scope.locationMarkers = list;
    console.log($scope.locationMarkers);
  });

  let activeMarker = null;
  $scope.toggleMarker = function(newMarker){
    if(activeMarker)
      activeMarker.icon = Constants.icon.inactive;
    activeMarker = newMarker;
    activeMarker.icon = Constants.icon.active;
  };

  $scope.markerClicked = function(ev){
    $scope.toggleMarker(ev.model);
    $scope.showDetails(ev.model.company_id);
  };

  $scope.showDetails = function(company_id){
    Companies.get(company_id).then(function(company){
      console.log(company);
      $scope.activeCompany = company;
    });
  };
}).factory('Locations', function($q, $http){
  function Locations(){}

  Locations.prototype.getAll = function(){
    const self = this;
    return $q(function(resolve, reject) {
      $http.get('/api/location/listall').then(function(res){
        if(res.data.status == 'success'){
          return resolve(res.data.locations);
        } else {
          return reject(res.data.error);
        }
      });
    });
  };

  return new Locations();
}).factory('Companies', function($q, $http){
  function Companies(){}

  Companies.prototype.get = function(id){
    const self = this;
    return $q(function(resolve, reject) {
      $http.get('/api/company/'+id).then(function(res){
        if(res.data.status == 'success'){
          return resolve(res.data.company);
        } else {
          return reject(res.data.error);
        }

      });
    });
  };

  Companies.prototype.getList = function () {
    const self = this;
    return $q(function(resolve, reject) {
      $http.get('/api/company/listall').then(function(res){
        resolve(res.data);
      }, reject);
    });
  };

  Companies.prototype.add = function(company){
    const self = this;
    return $q(function(resolve, reject) {
      $http.post('/api/company/create', company).then(function(req, res){
        resolve();
      });
    });
  };

  Companies.prototype.update = function(company){
    const self = this;
    return $q(function(resolve, reject) {
      $http.post('/api/company/update', company).then(function(req, res){
        resolve();
      });
    });

  };

  return new Companies();
}).factory('locationsToMarkers', function(Constants){
  return function(locations){
    _.each(locations, function(location){
      location.icon = Constants.icon.inactive;
    });
  };
}).factory('Constants', function(){
  return {
    icon: {
      active: 'icons/neutralCirc.png',
      inactive: 'icons/activeCirc.png'
    }
  };
}).directive('showDetails', function(){
  function ShowDetailsCtrl ($scope) {
    $scope.centerOn = function(coords){
      if($scope.map) $scope.map.center = _.clone(coords);
    }
  }
  let scope = {
    company: '=',
    map: '='
  };
  return {
    controller: ShowDetailsCtrl,
    scope: scope,
    templateUrl: 'show-details.html'
  };
}).controller('AddCompanyCtrl', function($scope, Companies){
  const initCompany = function(){
    $scope.newCompany = {
      locations: [],
      values: []
    };
  };

  initCompany();

  $scope.addNewCompany = function(){
    Companies.add($scope.newCompany).then(initCompany);
  };

}).directive('mainNavBar', function(){
  return {
    templateUrl: 'main-nav-bar.html'
  };
}).controller('SelectNewLocation', function($scope, $uibModalInstance, uiGmapIsReady, map){
  let center = map.center;
  $scope.idKey = Date.now();
  $scope.map = map;

  // Workaround
  // See: http://stackoverflow.com/questions/28802902/angular-google-maps-not-working-with-templateurl-that-isnt-a-text-ng-template
  $scope.control = {};
  uiGmapIsReady.promise().then(function (maps) {
    $scope.map.center = center;
    $scope.control.refresh(center);
  });

  $scope.saveNewLocation = function(){
    $uibModalInstance.close(map.center);
  };
}).directive('editCompany', function(){
  function EditCompanyCtrl($scope, $uibModal){
    const initNewValue = function() {
      $scope.newValue = {};
    };

    initNewValue();

    $scope.addNewValue = function(){
      $scope.company.values.push($scope.newValue);
      initNewValue();
    };

    const openLocationDialog = function(coords, cb){
      let defaultCoords = { latitude: 48.14, longitude: 11.6 };
      let startCoords = coords ? _.clone(coords): defaultCoords;
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'choose-new-location.html',
        resolve: {
          map: function(){
            return { center: startCoords, zoom: 12 };
          }
        },
        controller: 'SelectNewLocation',
        size: 'lg'
      });

      modalInstance.result.then(cb);
    };

    $scope.openNewLocationDialog = function(){
      openLocationDialog(null, function(coords){
        $scope.company.locations.push({ coords: _.clone(coords)});
      });
    };

    $scope.openEditLocationDialog = function(location){
      openLocationDialog(location.coords, function(coords){
        location.coords = coords;
      });
    };
  }

  return {
    controller: EditCompanyCtrl,
    scope: { company: '=' },
    templateUrl: 'edit-company.html'
  };
}).controller('ListAndEditCompaniesCtrl', function($scope, Companies){
  Companies.getList().then((list) => {
    $scope.companies = list;
  });
  $scope.setActive = function(index){
    $scope.indexActive = index;
  };
  $scope.saveChanges = function(){
    Companies.update($scope.companies[$scope.indexActive]).then(function(){
      console.log('saved');
    });
  };
});
