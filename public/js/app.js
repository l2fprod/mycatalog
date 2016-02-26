// listen for request sent over XHR and automatically show/hide spinner
angular.module('ngLoadingSpinner', ['angularSpinners'])
  .directive('spinner', ['$http', 'spinnerService', function ($http, spinnerService) {
    return {
      link: function (scope, elm, attrs) {
        scope.isLoading = function () {
          return $http.pendingRequests.length > 0;
        };
        scope.$watch(scope.isLoading, function (loading) {
          if (loading) {
            spinnerService.show('spinner');
          } else {
            spinnerService.hide('spinner');
          }
        });
      }
    };
    }]);

var catalogApp = angular.module('catalogApp', [ 'ngLoadingSpinner']);

catalogApp.controller('MainController', function ($scope) {
  console.info("Initializing MainController");
  $scope.services = [];

  $scope.tagFilter = function(tag) {
    if (!tag.startsWith("ibm_")) {//= "ibm_beta" && tag != "ibm_created" && tag != "ibm_experimental") {
      return tag;
    } else {
      console.log("ignored", tag);
    }
  };
  
  $.ajax("/generated/services.json").done(function (services) {
    $scope.$apply(function () {
      $scope.services = services;
    });
  });
});
