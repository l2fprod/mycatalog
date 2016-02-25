var catalogApp = angular.module('catalogApp', []);

catalogApp.controller('MainController', function ($scope) {
  console.info("Initializing MainController");
  $scope.services = [];

  $.ajax("/data/services.json").done(function (services) {
//    services.forEach(function (service) {
//      if (service.metadata.guid) {
//        console.log(service.metadata.guid);
//      }
//    });
    $scope.$apply(function () {
      $scope.services = services;
    });
  });
});
