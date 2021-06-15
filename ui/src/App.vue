<template>
  <v-app>
    <v-app-bar app flat clipped-left clipped-right class="blue accent-2 white--text">
      <v-app-bar-nav-icon @click.stop="showFilterPanel = !showFilterPanel" class="white--text"></v-app-bar-nav-icon>
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
          @click:clear="setSearchTerm('', true)"
          @keydown.esc="setSearchTerm('', true)"
          v-on:keyup="setSearchTerm($event.target.value)"
          placeholder="Search Resources"
          prepend-inner-icon="mdi-magnify"
        ></v-text-field>
      </v-responsive>
      <v-spacer></v-spacer>
      <v-menu left bottom tile offset-y offset-x title="Export to Office documents">
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            v-on="on"
            class="white--text"
            title="Export Selection"
          >
            <v-icon>mdi-export-variant</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item>
            <v-list-item-title>
              <b>Export selection to</b>
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="exportSelection('pptx')">
            <v-list-item-title>
              <div><img src="/icons/ppt_logo.png" height="16" width="16"/>
              &nbsp; Powerpoint
              </div>
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="exportSelection('xlsx')">
            <v-list-item-title>
              <div><img src="/icons/excel_logo.png" height="16" width="16"/>
              &nbsp; Excel
              </div>
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="exportSelection('docx')">
            <v-list-item-title>
              <div><img src="/icons/word_logo.png" height="16" width="16"/>
              &nbsp; Word
              </div>
            </v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item>
            <v-list-item-title class="text-center">
              <img src="/icons/poster.png" width="200"/>
              <br/>
              Get the poster in <a target="_new" href="/generated/cheatsheet.pdf">light</a> or <a target="_new" href="/generated/cheatsheet-dark.pdf">dark</a>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
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
    <v-footer fixed app class="text-body-2">
      <span>
        <b>My Catalog</b> uses the public <a href="https://cloud.ibm.com/apidocs/resource-catalog/global-catalog">Global Catalog API</a>
        to retrieve data from the official <a href="https://cloud.ibm.com/catalog">IBM Cloud catalog</a>.
        It attempts to be as accurate as possible. Use with care.
      </span>
      <v-spacer></v-spacer>
      <span>
        made by <a href="https://twitter.com/lionelmace">lionel</a> and <a href="https://twitter.com/l2fprod">fred</a>,
        source on <v-btn icon href="https://github.com/l2fprod/mycatalog/" x-small><v-icon>mdi-github</v-icon></v-btn>
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
    setSearchTerm(text, immediate = false) {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
        this.searchTimer = null;
      }
      if (immediate) {
        this.$store.commit('SET_SEARCH_TERM', text);
      } else {
        this.searchTimer = setTimeout(() => {
          this.$store.commit('SET_SEARCH_TERM', text);
        }, 300);
      }
    },
    exportSelection(format) {
      this.$store.dispatch('exportSelection', {
        format,
      });
    },
  }
};
</script>

<style lang="scss">
  body, html {
    overflow: hidden
  }
</style>
