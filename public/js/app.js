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
  return function (resources, filterConfiguration) {
    if (filterConfiguration.enabled) {
      var results = [];
      resources.forEach(function (resource) {
        var keepResource = false;

        // if no tag checked, show everything
        if (filterConfiguration.includeTags.length == 0 &&
          filterConfiguration.excludeTags.length == 0) {
          keepResource = true;
        }

        // if no include, assume all included and let the exclude tag remove some
        if (filterConfiguration.includeTags.length == 0) {
          keepResource = true;
        } else {
          keepResource = true;
          filterConfiguration.includeTags.forEach(function (tag) {
            if (resource.tags.indexOf(tag) < 0) {
              keepResource = false;
            }
          });
        }

        filterConfiguration.excludeTags.forEach(function (tag) {
          if (resource.tags.indexOf(tag) >= 0) {
            keepResource = false;
          }
        });

        if (keepResource) {
          results.push(resource);
        }
      });
      return results;
    } else {
      return resources;
    }
  }
});

catalogApp.controller('MainController', function ($scope, $http) {
  console.info("Initializing MainController");
  $scope.resources = [];
  $scope.selection = {
    resources: []
  };
  $scope.categories = categories;
  $scope.regions = regions;
  $scope.selectedService = {};
  $scope.viewSelected = false;

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
    $scope.selection.resources = $scope.resources.map(function (resource) {
      return resource.id;
    });
  }

  $scope.deselectAll = function () {
    $scope.selection.resources = [];
  }

  $scope.selectFiltered = function () {
    $scope.filteredResources.forEach(function (resource) {
      if ($scope.selection.resources.indexOf(resource.id) < 0) {
        $scope.selection.resources.push(resource.id);
      }
    });
  }

  $scope.deselectFiltered = function () {
    var filteredGuids = $scope.filteredResources.map(function (resource) {
      return resource.id;
    });

    // remove the guid currently visible
    var newSelection =
      $scope.selection.resources.filter(function (guid) {
        return filteredGuids.indexOf(guid) < 0;
      });

    $scope.selection.resources = [];
    $scope.selection.resources = newSelection;
  }

  $scope.exportSelection = function (format) {
    if ($scope.selection.resources.length > 0) {
      $.redirect("/api/export/" + format, {
        resources: $scope.selection.resources
      });
    } else {
      $.redirect("/api/export/" + format);
    }
  }

  $scope.consoleUrl = function (resource) {
    if (resource.kind === 'service') {
      return 'https://console.bluemix.net/catalog/services/' + resource.name;
    } else {
      return 'https://console.bluemix.net/catalog/infrastructure/' + resource.name;
    }
  }

  $scope.showServiceDetails = function (resource) {
    console.log("Showing service details", resource.displayName);
    $scope.selectedService = resource;
    $("#serviceDetails").modal();
  }

  $scope.quote = function (text) {
    if (text && text.indexOf(" ") >= 0) {
      return '"' + text + '"';
    } else {
      return text;
    }
  }

  $http.get("/generated/resources.json").success(function (resources) {
    $scope.resources = resources;
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
