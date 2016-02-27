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
}]).controller('ShowMapCtrl', function ($scope, Companies, companiesToMarkers, Constants, $uibModal){
  const munich = { latitude: 48.14, longitude: 11.6 };

  $scope.map = { center: munich, zoom: 12 };

  Companies.getList().then((list) => {
    $scope.companies = list;
    $scope.companyMarkers = companiesToMarkers(list);
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

  $scope.openAddCompanyDialog = function (){
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'addCompanyDialog.html',
      controller: 'AddCompanyCtrl',
      size: 'lg'
    });
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
    _.each(companies, function(company){
      _.each(company.locations, function(location){
        console.log(location)
        companyMarkers.push({
          id: company.id,
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
    templateUrl: 'showDetails.html'
  };
}).controller('AddCompanyCtrl', function($scope, Companies){
  function init(){
    $scope.newCompany = {
      locations: [],
      values: []
    };
  }

  init();

  $scope.addCompany = function(){
    Companies.add($scope.newCompany).then(init);
  }
}).directive('mainNavBar', function(){
  return {
    templateUrl: 'main-nav-bar.html'
  };
});
