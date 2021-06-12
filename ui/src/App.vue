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
    <v-navigation-drawer
      app clipped left width="300"
      v-model="showFilterPanel">
      <filter-panel/>
    </v-navigation-drawer>
    <product-details/>
    <v-main>
      <v-container fluid style="height: calc(100vh - 65px - 48px - 32px); padding: 0">
        <v-layout fill-height>
          <product-table/>
        </v-layout>
      </v-container>
    </v-main>
    <v-footer fixed app>
      <span>
        <b>My Catalog</b> uses the public <a href="https://cloud.ibm.com/apidocs/resource-catalog/global-catalog">Global Catalog API</a>
        to retrieve data from the official <a href="https://cloud.ibm.com/catalog">IBM Cloud catalog</a>.
        It attempts to be as accurate as possible. Use with care.
      </span>
      <v-spacer></v-spacer>
      <span>
        made by <a href="https://twitter.com/lionelmace">lionel</a> and <a href="https://twitter.com/l2fprod">fred</a>
      </span>
    </v-footer>
  </v-app>
</template>

<script>
import FilterPanel from './components/FilterPanel.vue';
import ProductDetails from './components/ProductDetails.vue';
import ProductTable from './components/ProductTable.vue';

export default {
  name: 'App',

  components: {
    ProductTable,
    ProductDetails,
    FilterPanel,
  },

  data: () => ({
    showFilterPanel: true,
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

<style lang="scss">
  body, html {
    overflow: hidden
  }
</style>
