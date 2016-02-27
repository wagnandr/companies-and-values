'use strict';

angular.module('valuesMain', [
  'uiGmapgoogle-maps'
]).controller('MainCtrl', function ($scope, Companies, companiesToMarkers, Constants){
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
  function ShowDetailsCtrl ($scope) {}
  let scope = {
    company: '='
  };
  return {
    controller: ShowDetailsCtrl,
    scope: scope,
    templateUrl: 'showDetails.html'
  };
});
