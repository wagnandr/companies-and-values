angular.module('valuesMain', [
  'uiGmapgoogle-maps'
]).controller('MainCtrl', function ($scope){
  'use strict';

  const munich = { latitude: 48.14, longitude: 11.6 }

  $scope.map = { center: munich, zoom: 12 };
});
