import axios from 'axios'
import fileDownload from 'js-file-download';
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

function matchesCategory(resource, category) {
  return resource.tags.filter(function(tag) {
    return category.tags.indexOf(tag) >= 0  ||
      category.tags.indexOf(resource.name) >= 0;
  }).length > 0;
}

function applyFilter(state) {
  const start = new Date().getTime();
  const filteredResources = [];
  const searchTerm = state.searchTerm == null || state.searchTerm.trim().length == 0 ?
    null : state.searchTerm.trim().toLowerCase();

  let includeTags = [];
  let excludeTags = [];

  //PENDING(fredL): services marked as global should also appear as soon as one region tag is selected
  state.selectedRegions.forEach(region => includeTags.push(region.tag));
  state.selectedFilters.forEach(filter => {
    if (filter.exclude) {
      if (filter.tags) {
        excludeTags = excludeTags.concat(filter.tags);
      } else {
        excludeTags.push(filter.id)
      }
    } else if (filter.tags) {
      includeTags = includeTags.concat(filter.tags);
    } else {
      includeTags.push(filter.id)
    }
  });

  console.log("Filtering with", "search=", searchTerm, "includeTags=", includeTags, "excludeTags=", excludeTags, "state=", state);

  // if no filter, filteredResources == resources
  if (searchTerm == null &&
      includeTags.length == 0 &&
      excludeTags.length == 0 &&
      state.selectedCategories.length == 0) {
    return state.resources;
  }

  state.resources.forEach((resource) => {
    let keepResource = false;
    let inSelectedCategories = false;
    let inIncludedTags = false;
    let inExcludedTags = false;

    if (includeTags.length == 0 &&
      excludeTags.length == 0 &&
      state.selectedCategories.length == 0) {
      keepResource = true;
    }

    // in any of the categories?
    if (state.selectedCategories.length > 0) {
      state.selectedCategories.forEach((category) => {
        if (matchesCategory(resource, category)) {
          inSelectedCategories = true;
        }
      });
    } else {
      inSelectedCategories = true;
    }

    // in all the included tags?
    if (includeTags.length > 0) {
      inIncludedTags = true;
      includeTags.forEach(function (tag) {
        if (resource.tags.indexOf(tag) < 0) {
          inIncludedTags = false;
        }
      });
    } else {
      inIncludedTags = true;
    }

    // in any of the excluded tags?
    if (excludeTags.length > 0) {
      excludeTags.forEach(function (tag) {
        if (resource.tags.indexOf(tag) >= 0) {
          inExcludedTags = true;
        }
      });
    } else {
      inExcludedTags = false;
    }

    if (inSelectedCategories && inIncludedTags && !inExcludedTags) {
      keepResource = true;
    }

    // and at last the searchTerm
    if (keepResource && searchTerm != null) {
      keepResource = JSON.stringify(resource).toLowerCase().indexOf(searchTerm) > 0;
    }

    if (keepResource) {
      filteredResources.push(resource);
    }
  });

  console.log(`Filtered in ${new Date().getTime() - start} milliseconds`);
  return filteredResources;
}

export default new Vuex.Store({
  state: {
    resources: [],
    resourceStatuses: {},
    selectedResources: [],
    selectedResource: null,
    selectedPlan: null,
    selectedCategories: [],
    selectedRegions: [],
    selectedFilters: [],
    searchTerm: null,
    showStatusOverlay: true,

    filteredResources: [],

    config: {
      categories: [],
      regions: [],
      filters: []
    }
  },
  mutations: {
    SET_RESOURCES(state, resources) {
      state.resources = resources
      state.resources.forEach((resource) => {
        resource.tags = [...new Set(resource.tags)];
        resource.tags.sort();
        resource.geo_tags = [...new Set(resource.geo_tags)];
        resource.geo_tags.sort();
      });
      state.filteredResources = applyFilter(state);
      state.selectedResource = null;
    },
    SET_SELECTED_RESOURCES(state, selectedResources) {
      state.selectedResources = selectedResources
    },
    SET_SELECTED_RESOURCE(state, selectedResource) {
      state.selectedResource = selectedResource;
      state.selectedPlan = selectedResource && selectedResource.plans && selectedResource.plans.length > 0 ?
        selectedResource.plans[0] : null;
    },
    SET_SELECTED_PLAN(state, selectedPlan) {
      state.selectedPlan = selectedPlan
    },
    SET_SEARCH_TERM(state, searchTerm) {
      state.searchTerm = searchTerm;
      state.filteredResources = applyFilter(state);
    },
    SET_SHOW_STATUS_OVERLAY(state, showStatusOverlay) {
      state.showStatusOverlay = showStatusOverlay;
    },
    SET_CONFIG(state, config) {
      state.config = config;
      // put regions and categories in a good order from the start
      state.config.regions.sort((r1, r2) => r1.label.localeCompare(r2.label));
      state.config.categories.sort((c1, c2) => c1.label.localeCompare(c2.label));
    },
    SET_SELECTED_CATEGORIES(state, selectedCategories) {
      state.selectedCategories = selectedCategories;
      state.filteredResources = applyFilter(state);
    },
    SET_SELECTED_REGIONS(state, selectedRegions) {
      state.selectedRegions = selectedRegions;
      state.filteredResources = applyFilter(state);
    },
    SET_SELECTED_FILTERS(state, selectedFilters) {
      state.selectedFilters = selectedFilters;
      state.filteredResources = applyFilter(state);
    },
    SET_STATUSES(state, statusItems) {
      state.resourceStatuses = {};
      console.log(`Got ${statusItems.length} status updates`);

      state.resources.forEach((resource) => {
        state.resourceStatuses[resource.name] = {
          hasIncident: false,
          regionsWithIncidents: {}
        };
      });

      statusItems.forEach((statusItem) => {
        if (statusItem.type == 'incident' &&
            statusItem.state != 'resolved') {
          statusItem.resourceIDs.forEach(resourceId => {
            // is.vpc comes as is-vpc in incident
            if (resourceId == 'is-vpc') {
              resourceId = 'is.vpc'
            }
            if (state.resourceStatuses[resourceId]) {
              state.resourceStatuses[resourceId].hasIncident = true;
              statusItem.regions.forEach((region) => {
                state.resourceStatuses[resourceId].regionsWithIncidents[region] = true;
              });
            } else {
              console.log(`Status not found for ${resourceId}`);
            }
          });
        }
      });
    }
  },
  getters: {
    hasIncident: (state) => (resourceName, region) => {
      const status = state.resourceStatuses[resourceName];
      return status && status.hasIncident && status.regionsWithIncidents[region];
    }
  },
  actions: {
    getResources({commit}) {
      axios.get('/generated/resources.json')
        .then(response => {
          commit('SET_RESOURCES', response.data);
          this.dispatch('getStatus');
        });
    },
    getStatus({commit}) {
      axios.get('/api/status')
        .then(response => {
          commit('SET_STATUSES', response.data.statusItems);
        });
    },
    export({commit}, { selectedResources, format }) {
      const selectedIds = selectedResources.map(resource => resource.id);
      axios.post(`/api/export/${format}`, {
        resources: selectedIds.length > 0 ? selectedIds : null
      },
      {
        responseType: 'blob'
      }).then((response) => fileDownload(response.data, `mycatalog-${new Date().toJSON().slice(0,10)}.${format}`));
    },
  },
  modules: {
  }
})
