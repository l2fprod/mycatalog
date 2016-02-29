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

var catalogApp = angular.module('catalogApp', ['ngLoadingSpinner', 'checklist-model']);

catalogApp.controller('MainController', function ($scope) {
  console.info("Initializing MainController");
  $scope.services = [];
  $scope.selection = {
    services: []
  };

  $scope.tagFilter = function (tag) {
    if (categories.indexOf(tag) >= 0) {
      return tag;
    } else {
      return null;
    }
  };

  $scope.exportSelection = function (format) {
    if ($scope.selection.services.length > 0) {
      $.redirect("/api/export/" + format, { services: $scope.selection.services });
    } else {
      $.redirect("/api/export/" + format);
    }
  }

  $.ajax("/generated/services.json").done(function (services) {
    $scope.$apply(function () {
      $scope.services = services;
    });
  });
});
