import axios from 'axios'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

function applyFilter(resources, searchTerm) {
  if (searchTerm == null || searchTerm.trim().length == 0) {
    return resources;
  } else {
    searchTerm = searchTerm.toLowerCase();
    return resources.filter(resource => JSON.stringify(resource).toLowerCase().indexOf(searchTerm) > 0);
  }
}

export default new Vuex.Store({
  state: {
    resources: [],
    selectedResources: [],

    selectedResource: null,
    selectedPlan: null,

    searchTerm: null,
    filteredResources: [],
    config: {
      catalogCategories: [],
      regions: []
    }
  },
  mutations: {
    SET_RESOURCES(state, resources) {
      state.resources = resources
      state.filteredResources = applyFilter(state.resources, state.searchTerm);
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
      state.filteredResources = applyFilter(state.resources, searchTerm);
    },
    SET_CONFIG(state, config) {
      state.config = config;
    }
  },
  actions: {
    getResources({commit}) {
      axios.get('https://mycatalog.mybluemix.net/generated/resources.json')
        .then(response => {
          commit('SET_RESOURCES', response.data);
        });
    },
  },
  modules: {
  }
})
