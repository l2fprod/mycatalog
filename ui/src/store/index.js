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
  state.selectedDatacenters.forEach(dc => includeTags.push(dc.tag));
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

const store = new Vuex.Store({
  state: {
    resources: [],
    selectedResource: null,
    selectedPlan: null,
    selectedCategories: [],
    selectedRegions: [],
    selectedDatacenters: [],
    selectedFilters: [],
    searchTerm: null,

    filteredResources: [],

    config: {
      categories: [],
      geographies: [],
      regions: [],
      datacenters: [],
      filters: [],
    }
  },
  mutations: {
    SET_RESOURCES(state, resources) {
      state.resources = resources;
      state.resources.forEach((resource) => {
        resource.tags = [...new Set(resource.tags)];
        resource.tags.sort();
        resource.geo_tags = [...new Set(resource.geo_tags)];
        resource.geo_tags.sort();
      });
      state.filteredResources = applyFilter(state);
      state.selectedResource = null;
    },
    SET_SELECTED_RESOURCE(state, selectedResource) {
      state.selectedResource = selectedResource;
      let plan = null;
      if (selectedResource && selectedResource.plans && selectedResource.plans.length > 0) {
        plan = selectedResource.plans.find(plan => plan.name === "lite")
        if (!plan) {
          plan = selectedResource.plans.find(plan => plan.name === "standard");
        }
        if (!plan) {
          plan = selectedResource.plans[0];
        }
      }
      state.selectedPlan = plan;
    },
    SET_SELECTED_PLAN(state, selectedPlan) {
      state.selectedPlan = selectedPlan
    },
    SET_SEARCH_TERM(state, searchTerm) {
      state.searchTerm = searchTerm;
      state.filteredResources = applyFilter(state);
    },
    SET_CONFIG(state, config) {
      state.config = config;
    },
    SET_SELECTED_CATEGORIES(state, selectedCategories) {
      state.selectedCategories = selectedCategories;
      state.filteredResources = applyFilter(state);
    },
    SET_SELECTED_REGIONS(state, selectedRegions) {
      state.selectedRegions = selectedRegions;
      state.filteredResources = applyFilter(state);
    },
    SET_SELECTED_DATACENTERS(state, selectedDatacenters) {
      state.selectedDatacenters = selectedDatacenters;
      state.filteredResources = applyFilter(state);
    },
    SET_SELECTED_FILTERS(state, selectedFilters) {
      state.selectedFilters = selectedFilters;
      state.filteredResources = applyFilter(state);
    },
  },
  actions: {
    async initialize({ commit }) {
      console.log("Initializing store...");
      const categories = (await axios.get('/js/categories.json')).data;
      const geographies = (await axios.get('/generated/geographies.json')).data
      const regions = [];
      const datacenters = [];
      for (const geo of geographies) {
        for (const region of geo.regions) {
          regions.push(region);
        }
        for (const dc of geo.datacenters) {
          datacenters.push(dc);
        }
      }

      categories.sort((c1, c2) => c1.label.localeCompare(c2.label));
      regions.sort((r1, r2) => r1.label.localeCompare(r2.label));
      datacenters.sort((r1, r2) => r1.label.localeCompare(r2.label));

      commit('SET_CONFIG', {
        categories,
        geographies,
        regions,
        datacenters,
        filters: [
          {
            "id": "custom_kind_iaas",
            "label": "IaaS",
            "icon": "mdi-server"
          },
          {
            "id": "custom_kind_service",
            "label": "PaaS",
            "icon": "mdi-room-service"
          },
          {
            "id": "ibm_created",
            "label": "IBM"
          },
          {
            "id": "ibm_third_party",
            "label": "Third party"
          },
          //  data-track-label="Production Ready" data-toggle="button" ng-click="toggleTagConfiguration('', false); toggleTagConfiguration('', false)"></button>
          {
            "id": "ibm_production_ready",
            "label": "Production Ready",
            "exclude": true,
            "tags": [
              "ibm_experimental",
              "ibm_beta"
            ],
            "icon": "mdi-thumb-up"
          },
          {
            "id": "ibm_beta",
            "label": "Beta",
            "icon": "mdi-beta"
          },
          //  data-track-label="Experimental" data-toggle="button" ng-click="toggleTagConfiguration('', true)"><i class="fa fa-flask"></i>&nbsp;Experimental</button>
          {
            "id": "ibm_experimental",
            "label": "Experimental",
            "icon": "mdi-flask"
          },
          //  data-track-label="Deprecated" data-toggle="button" ng-click="toggleTagConfiguration('', true)"><i class="fa fa-exclamation-triangle"></i>&nbsp;</button>
          {
            "id": "ibm_deprecated",
            "label": "Deprecated",
            "icon": "mdi-alert"
          },
          //  data-track-label="Free plan" data-toggle="button" ng-click="toggleTagConfiguration('', true)"><i class="fa fa-usd"></i>&nbsp;</button>
          {
            "id": "free",
            "label": "Free plan",
            "icon": "mdi-currency-usd"
          },
          //  data-track-label="Lite plan" data-toggle="button" ng-click="toggleTagConfiguration('', true)"><i class="fa fa-usd"></i>&nbsp;</button>
          {
            "id": "lite",
            "label": "Lite plan",
            "icon": "mdi-currency-usd"
          },
          //  data-track-label="Syndicated" data-toggle="button" ng-click="toggleTagConfiguration('', true)" title="IBM public services visible in the dedicated and local catalogs"><i class="fa fa-cloud"></i>&nbsp;</button>
          // {
          //   "id": "ibm_dedicated_public",
          //   "label": "Syndicated"
          // },
          //  data-track-label="IAM" data-toggle="button" ng-click="toggleTagConfiguration('', true)" title="IAM Compatible"></button>
          {
            "id": "iam_compatible",
            "label": "IAM Compatible"
          },
          //  data-track-label="RC" data-toggle="button" ng-click="toggleTagConfiguration('', true)" title="Resource Catalog Compatible"></button>
          {
            "id": "rc_compatible",
            "label": "RC Compatible"
          },
          //  data-track-label="EU supported" data-toggle="button" ng-click="toggleTagConfiguration('', true)" title="EU supported"></button>
          {
            "id": "eu_access",
            "label": "EU supported"
          },
          //  data-track-label="HIPAA" data-toggle="button" ng-click="toggleTagConfiguration('', true)" title="HIPAA"></button>
          {
            "id": "hipaa",
            "label": "HIPAA",
            "icon": "mdi-hospital-box"
          },
          //  data-track-label="FS Validated" data-toggle="button" ng-click="toggleTagConfiguration('', true)" title="Financial Services Validated"></button>
          {
            "id": "fs_ready",
            "label": "FS Validated",
            "icon": "mdi-bank"
          },
          // satellite
          {
            "id": "satellite_enabled",
            "label": "Satellite Enabled",
            "icon": "mdi-satellite-variant"
          },
          // service endpoint supported
          {
            "id": "service_endpoint_supported",
            "label": "Service Endpoint Supported",
            "icon": "mdi-lock-check"
          },
          {
            "id": "cbr_enabled",
            "label": "Context-based restrictions Supported",
            "icon": "mdi mdi-axis-arrow-lock"
          }
        ],
      });
      this.dispatch('getResources');
    },
    getResources({ commit }) {
      axios.get('/generated/resources.json')
        .then(response => {
          commit('SET_RESOURCES', response.data);
        });
    },
  },
  modules: {
  }
});

// initialize the store
store.dispatch('initialize');

export default store;
