<template>
  <v-app>
    <v-app-bar
      app
      flat
      clipped-left
      clipped-right
      class="blue accent-2 white--text"
    >
      <v-app-bar-nav-icon
        @click.stop="showFilterPanel = !showFilterPanel"
        class="white--text"
      ></v-app-bar-nav-icon>
      <v-toolbar-title>My Catalog</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-responsive max-width="500">
        <v-text-field
          spellcheck="false"
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
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            v-on="on"
            icon
            href="/generated/mycatalog.pptx"
            color="red lighten-1"
          >
            <img src="/icons/ppt_logo.png" height="24" width="24" />
          </v-btn>
        </template>
        <span>Download as Powerpoint</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            v-on="on"
            icon
            href="/generated/mycatalog.xlsx"
            color="green darken-3"
          >
            <img src="/icons/excel_logo.png" height="24" width="24" />
          </v-btn>
        </template>
        <span>Download as Excel</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            v-on="on"
            icon
            href="/generated/mycatalog.docx"
            color="light-blue lighten-3"
          >
            <img src="/icons/word_logo.png" height="24" width="24" />
          </v-btn>
        </template>
        <span>Download as Word</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            v-on="on"
            icon
            href="/generated/cheatsheet.pdf"
            target="_blank"
          >
            <v-icon color="black" class="white">mdi-format-list-text</v-icon>
          </v-btn>
        </template>
        <span>
          <img src="/icons/poster.png" width="200" />
          <br />
          Get the poster with a light background
        </span>
      </v-tooltip>

      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            v-on="on"
            icon
            title="Get the poster with a dark background"
            href="/generated/cheatsheet-dark.pdf"
            target="_blank"
          >
            <v-icon color="white" class="black">mdi-format-list-text</v-icon>
          </v-btn>
        </template>
        <span> Get the poster with a dark background </span>
      </v-tooltip>

      <v-dialog v-model="showAboutDialog" max-width="600" transition="dialog-top-transition">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" icon title="About">
            <v-icon color="white">mdi-help-circle</v-icon>
          </v-btn>
        </template>
        <v-card>
          <v-card-title class="text-h5 blue white--text accent-2">
            About My Catalog
          </v-card-title>
          <v-card-text>
            <p class="mt-6">
              <b>My Catalog</b> uses the public
              <a
                href="https://cloud.ibm.com/apidocs/resource-catalog/global-catalog"
                >Global Catalog API</a
              >
              to retrieve data from the official <a href="https://cloud.ibm.com/catalog">IBM Cloud catalog</a>.
              It attempts to be as accurate as possible. Use with care.
            </p>
            <p class="mt-6">
              The source code can be found in <a href="https://github.com/l2fprod/mycatalog/">GitHub</a>.
            </p>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="showAboutDialog = false"> Close </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-app-bar>
    <v-navigation-drawer app clipped left width="300" v-model="showFilterPanel">
      <filter-panel />
    </v-navigation-drawer>
    <product-details />
    <v-main>
      <v-container
        fluid
        style="height: calc(100vh - 65px - 48px - 32px); padding: 0"
      >
        <v-layout fill-height>
          <product-table />
        </v-layout>
      </v-container>
    </v-main>
    <v-footer fixed app class="text-body-2">
      <span>
        <b>My Catalog</b> uses the public
        <a href="https://cloud.ibm.com/apidocs/resource-catalog/global-catalog"
          >Global Catalog API</a
        >
        to retrieve data from the official
        <a href="https://cloud.ibm.com/catalog">IBM Cloud catalog</a>. It
        attempts to be as accurate as possible. Use with care.
      </span>
      <v-spacer></v-spacer>
      <span>
        made by <a href="https://twitter.com/lionelmace">lionel</a> and
        <a href="https://twitter.com/l2fprod">fred</a>, source on
        <v-btn icon href="https://github.com/l2fprod/mycatalog/" x-small
          ><v-icon>mdi-github</v-icon></v-btn
        >
      </span>
    </v-footer>
  </v-app>
</template>

<script>
import FilterPanel from "./components/FilterPanel.vue";
import ProductDetails from "./components/ProductDetails.vue";
import ProductTable from "./components/ProductTable.vue";

export default {
  name: "App",

  components: {
    ProductTable,
    ProductDetails,
    FilterPanel,
  },

  data: () => ({
    showFilterPanel: true,
    showAboutDialog: false,
    ProductDetails, //
  }),

  computed: {
    searchTerm() {
      return this.$store.state.searchTerm;
    },
  },

  methods: {
    setSearchTerm(text, immediate = false) {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
        this.searchTimer = null;
      }
      if (immediate) {
        this.$store.commit("SET_SEARCH_TERM", text);
      } else {
        this.searchTimer = setTimeout(() => {
          this.$store.commit("SET_SEARCH_TERM", text);
        }, 300);
      }
    },
  },
};
</script>

<style>
body,
html {
  overflow: hidden;
}
</style>
