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

catalogApp.filter("filterPanel", function () {
  return function (services, filterConfiguration) {
    if (filterConfiguration.enabled) {
      var results = [];
      services.forEach(function (service) {
        var keepService = false;

        // if no tag checked, show everything
        if (filterConfiguration.includeTags.length == 0 &&
          filterConfiguration.excludeTags.length == 0) {
          keepService = true;
        }

        // if no include, assume all included and let the exclude tag remove some
        if (filterConfiguration.includeTags.length == 0) {
          keepService = true;
        } else {
          keepService = true;
          filterConfiguration.includeTags.forEach(function (tag) {
            if (service.entity.tags.indexOf(tag) < 0) {
              keepService = false;
            }
          });
        }

        filterConfiguration.excludeTags.forEach(function (tag) {
          if (service.entity.tags.indexOf(tag) >= 0) {
            keepService = false;
          }
        });

        if (keepService) {
          results.push(service);
        }
      });
      return results;
    } else {
      return services;
    }
  }
});

catalogApp.controller('MainController', function ($scope, $http) {
  console.info("Initializing MainController");
  $scope.services = [];
  $scope.selection = {
    services: []
  };
  $scope.categories = categories;
  $scope.regions = regions;

  $scope.filterConfiguration = {
    enabled: true,
    includeTags: [],
    excludeTags: []
  };

  $scope.toggleTagConfiguration = function (tag, status) {
    var tagSet = status ? $scope.filterConfiguration.includeTags : $scope.filterConfiguration.excludeTags;
    var position = tagSet.indexOf(tag);
    if (position >= 0) {
      tagSet.splice(position, 1);
    } else {
      tagSet.push(tag);
    }
  }

  $scope.tagFilter = function (tag) {
    if (categories.indexOf(tag) >= 0) {
      return tag;
    } else {
      return null;
    }
  };

  $scope.exportSelection = function (format) {
    if ($scope.selection.services.length > 0) {
      $.redirect("/api/export/" + format, {
        services: $scope.selection.services
      });
    } else {
      $.redirect("/api/export/" + format);
    }
  }

  $http.get("/generated/services.json").success(function (services) {
    $scope.services = services;
  });
});
