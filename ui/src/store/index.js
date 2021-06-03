import axios from 'axios'
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
  const filteredResources = [];
  const searchTerm = state.searchTerm == null || state.searchTerm.trim().length == 0 ?
    null : state.searchTerm.trim().toLowerCase();

  const includeTags = [];
  //PENDING(fredL): services marked as global should also appear as soon as one region tag is selected
  state.selectedRegions.forEach(region => includeTags.push(region.tag));

  state.resources.forEach((resource) => {
    let keepResource = false;

    if (includeTags.length == 0 &&
      state.selectedCategories.length == 0) {
      keepResource = true;
    }

    // if the resource matches any category, keep it
    if (state.selectedCategories.length > 0) {
      state.selectedCategories.forEach((category) => {
        if (matchesCategory(resource, category)) {
          keepResource = true
        }
      });
    }

    // if the resource matches any includeFilters, keep it
    if (includeTags.length > 0) {
      keepResource = true
      includeTags.forEach(function (tag) {
        if (resource.tags.indexOf(tag) < 0) {
          keepResource = false;
        }
      });
    }

    // and at last the searchTerm
    if (searchTerm != null) {
      keepResource = JSON.stringify(resource).toLowerCase().indexOf(searchTerm) > 0;
    }

    if (keepResource) {
      filteredResources.push(resource);
    }
  });

  return filteredResources;
}

// if (filterConfiguration.enabled) {
//   var results = [];
//   resources.forEach(function (resource) {
//     var keepResource = false;

//     // if no tag checked, show everything
//     if (filterConfiguration.includeTags.length == 0 &&
//       filterConfiguration.excludeTags.length == 0 &&
//       filterConfiguration.includeCategories.length == 0) {
//       keepResource = true;
//     }

//     // if the resource matches any category, keep it
//     if (filterConfiguration.includeCategories.length > 0) {
//       filterConfiguration.includeCategories.forEach(function(category) {
//         if (matchesCategory(resource, category)) {
//           keepResource = true
//         }
//       });
//     }

//     // if the resource matches any includeFilters, keep it
//     if (filterConfiguration.includeTags.length > 0) {
//       keepResource = true
//       filterConfiguration.includeTags.forEach(function (tag) {
//         if (resource.tags.indexOf(tag) < 0) {
//           keepResource = false;
//         }
//       });
//     }

//     // if not "include" filters defined but we have exclude, keep the resource and let the exclude decide
//     if (filterConfiguration.includeCategories.length == 0 &&
//       filterConfiguration.includeTags.length == 0 &&
//       filterConfiguration.excludeTags.length > 0) {
//       keepResource = true
//     }

//     // and the exclude
//     filterConfiguration.excludeTags.forEach(function (tag) {
//       if (resource.tags.indexOf(tag) >= 0) {
//         keepResource = false;
//       }
//     });

//     if (keepResource) {
//       results.push(resource);
//     }
//   });
//   return results;





export default new Vuex.Store({
  state: {
    resources: [],
    
    selectedResources: [],
    selectedResource: null,
    selectedPlan: null,
    selectedCategories: [],
    selectedRegions: [],
    selectedFilters: [],
    searchTerm: null,
    
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
    SET_SELECTED_FILTERS(state, selectedFilters) {
      state.selectedFilters = selectedFilters;
      state.filteredResources = applyFilter(state);
    }
  },
  actions: {
    getResources({commit}) {
      axios.get('/generated/resources.json')
        .then(response => {
          commit('SET_RESOURCES', response.data);
        });
    },
  },
  modules: {
  }
})
