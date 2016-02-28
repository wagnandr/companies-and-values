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
    otherwise({
      redirectTo: '/show-map'
    });
}]).controller('ShowMapCtrl', function ($scope, Companies, companiesToMarkers, Constants){
  const munich = { latitude: 48.14, longitude: 11.6 };

  $scope.map = { center: munich, zoom: 12 };

  Companies.getList().then((list) => {
    $scope.companies = list;
    $scope.companyMarkers = companiesToMarkers(list);

    // Temporary workaround to synchronize add
    $scope.$watch(function(){ return list.length; }, function(){
      $scope.companyMarkers = companiesToMarkers(list);
    })
  });

  let activeMarker = null;
  $scope.toggleMarker = function(newMarker){
    if(activeMarker)
      activeMarker.icon = Constants.icon.inactive;
    activeMarker = newMarker;
    activeMarker.icon = Constants.icon.active;
  };

  $scope.companyClicked = function(ev){
    $scope.toggleMarker(ev.model);
    $scope.showDetails(ev.model.company);
  };

  $scope.showDetails = function(company){
    $scope.activeCompany = company;
  };
}).factory('Companies', function($q){
  function Companies(){
    this.list = [{
      id: 0,
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
    }];
  }

  Companies.prototype.getList = function () {
    const self = this;
    return $q(function(resolve, reject) {
      resolve(self.list);
    });
  };

  Companies.prototype.add = function(company){
    const self = this;
    return $q(function(resolve, reject) {
      self.list.push(_.clone(company));
      resolve();
    });
  };

  return new Companies();
}).factory('companiesToMarkers', function(Constants){
  return function (companies){
    let companyMarkers = [];
    let markerId = 0;
    _.each(companies, function(company){
      _.each(company.locations, function(location){
        companyMarkers.push({
          id: markerId++,
          coords: location.coords,
          company: company,
          icon: Constants.icon.inactive
        });
      });
    });
    return companyMarkers;
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
  $scope.map = map;

  $scope.idKey = Date.now();

  // Workaround
  // See: http://stackoverflow.com/questions/28802902/angular-google-maps-not-working-with-templateurl-that-isnt-a-text-ng-template
  $scope.control = {};
  uiGmapIsReady.promise().then(function (maps) {
    $scope.control.refresh();
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

    $scope.openNewLocationDialog = function(){
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'choose-new-location.html',
        resolve: {
          map: function(){
            return { center: { latitude: 48.14, longitude: 11.6 }, zoom: 12 };
          }
        },
        controller: 'SelectNewLocation',
        size: 'lg'
      });

      modalInstance.result.then(function(coords){
        $scope.company.locations.push({ coords: _.clone(coords)});
      });
    };
  }

  return {
    controller: EditCompanyCtrl,
    scope: { company: '=' },
    templateUrl: 'edit-company.html'
  };
});
