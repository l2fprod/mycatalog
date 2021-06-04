<template>
  <v-app>
    <v-app-bar app flat clipped-left clipped-right>
      <v-app-bar-nav-icon @click.stop="showFilterPanel = !showFilterPanel"></v-app-bar-nav-icon>
      <v-toolbar-title>My Catalog</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-responsive max-width="500">
        <v-text-field
          hide-details
          rounded
          autofocus
          solo
          dense
          flat
          clearable
          :value="searchTerm"
          @change="setSearchTerm"
          @click:clear="setSearchTerm('')"
          v-on:keyup="setSearchTerm($event.target.value)"
          placeholder="Search Resources"
        ></v-text-field>
      </v-responsive>
      <v-spacer></v-spacer>
    </v-app-bar>
    <v-navigation-drawer app clipped left width="400" v-model="showFilterPanel">
      <filter-panel/>
    </v-navigation-drawer>
    <product-details/>
    <v-main>
      <v-container fluid style="height: calc(100vh - 65px); padding: 0">
        <v-layout fill-height>
          <product-table/>
        </v-layout>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import CriteriaPanel from './components/CriteriaPanel.vue';
import FilterPanel from './components/FilterPanel.vue';
import ProductDetails from './components/ProductDetails.vue';
import ProductTable from './components/ProductTable.vue';

export default {
  name: 'App',

  components: {
    CriteriaPanel,
    ProductTable,
    ProductDetails,
    FilterPanel,
  },

  data: () => ({
    showFilterPanel: false,
    ProductDetails  //
  }),

  mounted() {
    this.$store.dispatch('getResources');
  },

  computed: {
    searchTerm() {
      return this.$store.state.searchTerm;
    }
  },

  methods: {
    setSearchTerm(text) {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
        this.searchTimer = null;
      }
      this.searchTimer = setTimeout(() => {
        this.$store.commit('SET_SEARCH_TERM', text);
      }, 300);
    }
  }
};
</script>
