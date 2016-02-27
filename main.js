angular.module('valuesMain', [
  'uiGmapgoogle-maps'
]).controller('MainCtrl', function ($scope, Companies){
  'use strict';

  const munich = { latitude: 48.14, longitude: 11.6 }

  $scope.map = { center: munich, zoom: 12 };

  Companies.getList().then((list) => {
    let companyMarkers = $scope.companyMarkers = [];
    _.each(list, function(company){
      _.each(company.locations, function(location){
        console.log(location)
        companyMarkers.push({
          id: company.id,
          coords: location.coords,
          company: company
        });
      });
    });
    console.log(companyMarkers);

    $scope.companies = list;
  });

  $scope.companyClicked = function(marker){
    console.log(marker);
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
});
