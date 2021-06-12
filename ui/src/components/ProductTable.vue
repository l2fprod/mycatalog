<template>
  <v-data-table
    :loading="resources.length == 0"
    :headers="headers"
    :items="filteredResources"
    height="100%"
    style="width: 100%"
    disable-pagination
    fixed-header
    hide-default-footer
    show-select
    @click:row="selectRow"
    class="productTable"
    v-model="selectedResources"
  >
    <template v-slot:top>
      <v-container fluid>
        <v-row>
          <v-toolbar dense flat>
            <v-toolbar-title>
              <div class="text-body-2">
              <b>{{ resources.length }}</b> resources in the catalog
              <span v-if="filteredResources.length != resources.length"
                >, <b>{{ filteredResources.length }}</b> resources matching the
                search criteria</span
              >
              <span v-if="selectedResources.length > 0"
                >, <b>{{ selectedResources.length }}</b> selected</span>
              </div>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <span class="text-body-2">Export catalog to</span>
            <v-btn icon @click="exportSelection('pptx')">
              <img src="/icons/ppt_logo.png" height="30" width="30" />
            </v-btn>
            <v-btn icon @click="exportSelection('xlsx')">
              <img src="/icons/excel_logo.png" height="30" width="30" />
            </v-btn>
            <v-btn icon @click="exportSelection('docx')">
              <img src="/icons/word_logo.png" height="30" width="30" />
            </v-btn>
          </v-toolbar>
        </v-row>
      </v-container>
    </template>
    <template v-slot:[`item.icon`]="{ item }">
      <!-- <v-lazy>
        <img :src="'/generated/icons/' + item.id + '.png'" width="16" />
      </v-lazy> -->
      <v-img :src="'/generated/icons/' + item.id + '.png'" width="16" />
    </template>
    <template v-slot:[`item.displayName`]="{ item }">
      <span v-if="item.metadata.ui.hidden">{{ item.displayName }}</span>
      <a v-else :href="`https://cloud.ibm.com/catalog/services/${item.name}`">{{ item.displayName }}</a>
    </template>
    <template
      v-for="region in this.$store.state.config.regions"
      v-slot:[`item.${region.id}`]="{ item }"
    >
      <v-icon v-bind:key="region.id"
        
        small
        v-if="
          (item.geo_tags != null && item.geo_tags.indexOf('global') >= 0) ||
          item.tags.indexOf(region.tag) >= 0
        "
        >mdi-checkbox-marked-circle</v-icon
      >
    </template>
    <template v-slot:[`item.tags`]="{ item }">
      <v-lazy>
      <v-chip-group column>
        <v-chip
          v-if="item.tags.indexOf('ibm_created') >= 0"
          label
          x-small
          color="primary"
          >IBM</v-chip
        >
        <v-chip
          v-if="item.tags.indexOf('ibm_third_party') >= 0"
          label
          x-small
          color="green"
          text-color="white"
          >Third Party</v-chip
        >
        <v-chip
          v-if="item.tags.indexOf('ibm_beta') >= 0"
          label
          x-small
          color="orange"
          text-color="white"
          >Beta</v-chip
        >
        <v-chip
          v-if="item.tags.indexOf('ibm_experimental') >= 0"
          label
          x-small
          color="red"
          text-color="white"
          >Experimental</v-chip
        >
        <v-chip
          v-if="item.tags.indexOf('ibm_deprecated') >= 0"
          label
          x-small
          color="red"
          text-color="white"
          >Deprecated</v-chip
        >
        <v-chip
          v-if="item.pricing_tags && item.pricing_tags.indexOf('free') >= 0"
          label
          x-small
          color="secondary"
          >Free plan</v-chip
        >
        <v-chip
          v-if="item.pricing_tags && item.pricing_tags.indexOf('lite') >= 0"
          label
          x-small
          color="secondary"
          >Lite plan</v-chip
        >
        <v-chip
          v-if="item.geo_tags && item.geo_tags.indexOf('global') >= 0"
          label
          x-small
          color="orange"
          text-color="white"
          >Global</v-chip
        >
      </v-chip-group>
      </v-lazy>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  components: {
  },
  data() {
    const headers = [
      {
        text: "",
        align: "center",
        sortable: false,
        value: "icon",
        width: 32,
      },
      {
        text: "Name",
        align: "start",
        sortable: true,
        value: "displayName",
        width: 200,
      },
    ];
    this.$store.state.config.regions.forEach((region) => {
      headers.push({
        text: region.label,
        value: region.id,
        align: "center",
        sortable: false,
        width: 50,
      });
    });
    headers.push({ text: "Tags", value: "tags", sortable: false });
    // { text: "Description", value: "description" },
    return {
      headers,
      selectedResources: [],
    };
  },
  computed: {
    resources() {
      return this.$store.state.resources;
    },
    filteredResources() {
      return this.$store.state.filteredResources;
    },
  },
  methods: {
    selectRow(row) {
      this.$store.commit("SET_SELECTED_RESOURCE", row);
    },
    exportSelection(format) {
      this.$store.dispatch('export', {
        format,
        selectedResources: this.selectedResources
      });
    }
  },
});
</script>

<style scoped>
.productTable {
  margin: 0px;
  margin-left: 48px;
  margin-right: 48px;
  margin-bottom: 56px;
}

/deep/ tbody tr:nth-of-type(odd) {
   background-color: rgba(0, 0, 0, .03);
 }
</style>