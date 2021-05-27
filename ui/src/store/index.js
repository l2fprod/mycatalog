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
    searchTerm: null,
    filteredResources: [],
  },
  mutations: {
    SET_RESOURCES(state, resources) {
      state.resources = resources
      state.filteredResources = applyFilter(state.resources, state.searchTerm);
    },
    SET_SELECTED_RESOURCES(state, selectedResources) {
      state.selectedResources = selectedResources
    },
    SET_SELECTED_RESOURCE(state, selectedResource) {
      state.selectedResource = selectedResource;
    },
    SET_SEARCH_TERM(state, searchTerm) {
      state.searchTerm = searchTerm;
      state.filteredResources = applyFilter(state.resources, searchTerm);
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
