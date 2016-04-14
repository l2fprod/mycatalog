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
  $scope.slaveService = {};

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

  $scope.selectAll = function () {
    $scope.selection.services = $scope.services.map(function (service) {
      return service.metadata.guid;
    });
  }

  $scope.deselectAll = function () {
    $scope.selection.services = [];
  }

  $scope.selectFiltered = function () {
    $scope.filteredServices.forEach(function (service) {
      if ($scope.selection.services.indexOf(service.metadata.guid) < 0) {
        $scope.selection.services.push(service.metadata.guid);
      }
    });
  }

  $scope.deselectFiltered = function () {
    var filteredGuids = $scope.filteredServices.map(function (service) {
      return service.metadata.guid;
    });

    // remove the guid currently visible
    var newSelection =
      $scope.selection.services.filter(function (guid) {
        return filteredGuids.indexOf(guid) < 0;
      });

    $scope.selection.services = [];
    $scope.selection.services = newSelection;
  }

  $scope.exportSelection = function (format) {
    if ($scope.selection.services.length > 0) {
      $.redirect("/api/export/" + format, {
        services: $scope.selection.services
      });
    } else {
      $.redirect("/api/export/" + format);
    }
  }

  $scope.consoleUrl = function (service) {
    var link;
    $scope.regions.forEach(function (region) {
      if (!link && service.entity.tags.indexOf(region.tag) >= 0) {
        link = "https://" + region.console + "/catalog/services/" + service.entity.label;
      }
    });
    return link;
  }

  $scope.showServiceDetails = function (service) {
    console.log("Showing service details", service.entity.label);
    $scope.slaveService = service;
    $("#serviceDetails").modal();
  }

  $scope.quote = function (text) {
    if (text && text.indexOf(" ") >= 0) {
      return '"' + text + '"';
    } else {
      return text;
    }
  }

  $http.get("/generated/services.json").success(function (services) {
    $scope.services = services;
  });
});

// Allow to tag elements with "tracking" and metadata.
// Events are sent to analytics.
$(document).ready(function () {
  function track(item) {
    var e = item.getAttribute("data-track-category");
    e || (e = "Outbound");
    var i = item.getAttribute("data-track-action");
    i || (i = "Click");
    var n = item.getAttribute("data-track-label");
    n || (n = "Link");
    try {
      ga("send", "event", e, i, n);
    } catch (o) {}
  }
  $("body").on("click", ".tracking", function () {
    track(this);
  });
});
