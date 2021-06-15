<template>
  <v-data-table
    :loading="resources.length == 0"
    :headers="headers"
    :items="filteredResources"
    height="100%"
    style="width: 100%"
    disable-pagination
    fixed-header
    dense
    hide-default-footer
    show-select
    @click:row="selectRow"
    class="productTable"
    v-model="selectedResources"
  >
    <template v-slot:top>
      <v-container fluid>
        <v-row>
          <v-toolbar dense flat color="blue lighten-5">
            <div class="text-body-2">
              <b>{{ resources.length }}</b> resources in the catalog
              <span v-if="filteredResources.length != resources.length"
                >, <b>{{ filteredResources.length }}</b> resources matching the
                search criteria</span
              >
              <span v-if="selectedResources.length > 0"
                >, <b>{{ selectedResources.length }}</b> selected</span
              >
            </div>
            <v-spacer />
            <v-tooltip bottom max-width="200">
              <template v-slot:activator="{ on, attrs }">
                <div v-bind="attrs" v-on="on">
                  <v-switch v-model="showStatusOverlay" dense hide-details>
                    <template v-slot:label>
                      <span class="text-body-2">Resource status</span>
                    </template>
                  </v-switch>
                </div>
              </template>
              <span>
                Shows
                <v-icon small color="red">mdi-checkbox-marked-circle</v-icon>
                if there is an incident in progress for the resource in the
                region,
                <v-icon small color="green">mdi-checkbox-marked-circle</v-icon>
                otherwise
              </span>
            </v-tooltip>
          </v-toolbar>
        </v-row>
      </v-container>
    </template>
    <template v-slot:[`item.icon`]="{ item }">
      <v-img :src="'/generated/icons/' + item.id + '.png'" width="16" />
    </template>
    <template v-slot:[`item.displayName`]="{ item }">
      <span v-if="item.metadata.ui.hidden">{{ item.displayName }}</span>
      <a
        v-else
        @click.stop
        :href="`https://cloud.ibm.com/catalog/services/${item.name}`"
        >{{ item.displayName }}</a
      >
    </template>
    <template
      v-for="region in this.$store.state.config.regions"
      v-slot:[`item.${region.id}`]="{ item }"
    >
      <v-icon v-for="icon in getRegionIcon(item, region)"
        v-bind:key="icon.id"
        small
        :color="icon.color">{{ icon.icon }}</v-icon>
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
    // headers.push({
    //   text: "Tags", value: "tags", sortable: false,
    //   width: 500
    // });
    // { text: "Description", value: "description" },
    return {
      headers,
    };
  },
  computed: {
    resources() {
      return this.$store.state.resources;
    },
    filteredResources() {
      return this.$store.state.filteredResources;
    },
    selectedResources: {
      get() {
        return this.$store.state.selectedResources;
      },
      set(values) {
        this.$store.commit("SET_SELECTED_RESOURCES", values);
      },
    },
    showStatusOverlay: {
      get() {
        return this.$store.state.showStatusOverlay;
      },
      set(value) {
        this.$store.commit("SET_SHOW_STATUS_OVERLAY", value);
      },
    },
  },
  methods: {
    selectRow(row) {
      this.$store.commit("SET_SELECTED_RESOURCE", row);
    },
    exportSelection(format) {
      this.$store.dispatch("exportSelection", {
        format,
      });
    },
    hasIncident(resourceName, region) {
      return this.$store.getters.hasIncident(resourceName, region);
    },
    getRegionIcon(resource, region) {
      if (resource.tags.indexOf(region.tag) < 0 &&
         (resource.geo_tags != null && resource.geo_tags.indexOf('global') < 0)) {
        return [];
      }

      let icon = "mdi-checkbox-marked-circle";
      let color = null;

      if (this.showStatusOverlay) {
        if (this.hasIncident(resource.name, region.id)) {
          color = "red";
          icon = "mdi-alert-circle";
        } else {
          color = "green";
        }
      }

      return [{
        id: region.id,
        icon,
        color,
      }];
    }
  },
});
</script>

<style scoped>
/deep/ tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.03);
}
</style>