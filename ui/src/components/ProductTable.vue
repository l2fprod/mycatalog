<template>
  <v-data-table
    mobile-breakpoint="0"
    :loading="resources.length == 0"
    :headers="headers"
    :items="filteredResources"
    height="100%"
    style="width: 100%"
    disable-pagination
    fixed-header
    dense
    hide-default-footer
    @click:row="selectRow"
    class="productTable"
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
            </div>
            <v-spacer />
            <v-menu
              bottom
              left
              offset-y
              :close-on-content-click="false"
              v-model="locationPopup"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-btn small v-bind="attrs" v-on="on" class="ml-4">
                  Select Locations
                </v-btn>
              </template>
              <v-sheet>
                <v-alert dense text type="info" class="pa-4 ma-0" tile>
                  Select the columns to display in the table.
                </v-alert>
                <v-treeview
                  selectable
                  dense
                  :items="locationHierarchy"
                  v-model="selectedLocations"
                  style="min-width: 300px; min-height: 300px; max-height: 500px"
                  class="overflow-y-auto"
                >
                </v-treeview>
                <v-toolbar tile>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        icon
                        class="mr-2"
                        @click="selectedLocations = []"
                        v-bind="attrs"
                        v-on="on"
                        ><v-icon>mdi-broom</v-icon></v-btn
                      >
                    </template>
                    <span>Clear selection</span>
                  </v-tooltip>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        icon
                        @click="selectRegionLocations()"
                        v-bind="attrs"
                        v-on="on"
                        ><v-icon>mdi-earth</v-icon></v-btn
                      >
                    </template>
                    <span>Select regions only</span>
                  </v-tooltip>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        icon
                        @click="selectDatacenterLocations()"
                        v-bind="attrs"
                        v-on="on"
                        ><v-icon>mdi-office-building-outline</v-icon></v-btn
                      >
                    </template>
                    <span>Select data centers only</span>
                  </v-tooltip>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        icon
                        @click="selectAllLocations()"
                        v-bind="attrs"
                        v-on="on"
                        ><v-icon>mdi-select-all</v-icon></v-btn
                      >
                    </template>
                    <span>Select all locations</span>
                  </v-tooltip>
                  <v-spacer />
                  <v-btn color="primary" text @click="locationPopup = !locationPopup"
                    >Close</v-btn
                  >
                </v-toolbar>
              </v-sheet>
            </v-menu>
          </v-toolbar>
        </v-row>
      </v-container>
    </template>
    <template v-slot:[`item.icon`]="{ item }">
      <v-img :src="'/generated/icons/' + item.id + '.png'" width="16" />
    </template>
    <template v-slot:[`item.displayName`]="{ item }">
      <span v-if="item.metadata.ui && item.metadata.ui.hidden">{{ item.displayName }}</span>
      <a
        v-else
        @click.stop
        :href="`https://cloud.ibm.com/catalog/services/${item.name}`"
        >{{ item.displayName }}</a
      >
    </template>
    <template
      v-for="location in locations"
      v-slot:[`item.${location.id}`]="{ item }"
    >
      <v-icon
        v-for="icon in getLocationIcon(item, location)"
        v-bind:key="icon.id"
        small
        :color="icon.color"
        >{{ icon.icon }}</v-icon
      >
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data() {
    return {
      selectedLocations: [],
      locationPopup: false,
    };
  },
  watch: {
    "$store.state.config.regions": {
      immediate: true,
      handler() {
        if (this.selectedLocations.length == 0) {
          this.selectedLocations = this.$store.state.config.regions.map(
            (region) => region.id
          );
        }
      },
    },
  },
  computed: {
    headers() {
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
          class: "nameColumn",
        },
      ];
      this.locations.forEach((location) => {
        if (this.selectedLocations.indexOf(location.id) >= 0) {
          headers.push({
            text: location.label,
            value: location.id,
            align: "center",
            sortable: false,
            width: 50,
          });
        }
      });

      headers.push({
        width: "100%",
        sortable: false,
      });
      return headers;
    },
    locations() {
      const locations = [];
      for (const geo of this.$store.state.config.geographies) {
        for (const region of geo.regions) {
          locations.push(region);
        }
        for (const dc of geo.datacenters) {
          locations.push(dc);
        }
      }
      locations.sort((l1, l2) => l1.label.localeCompare(l2.label));
      return locations;
    },
    locationHierarchy() {
      return this.$store.state.config.geographies.map((geo) => {
        const children = [
          ...geo.regions.map((region) => {
            return {
              id: region.id,
              name: `${region.label} (Region ${region.tag})`,
            };
          }),
          ...geo.datacenters.map((dc) => {
            return {
              id: dc.id,
              name: `${dc.label} (${dc.tag})`,
            };
          }),
        ];
        children.sort((l1, l2) => l1.name.localeCompare(l2.name));
        return {
          id: geo.id,
          name: geo.label,
          children,
        };
      });
    },
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
      this.$store.dispatch("exportSelection", {
        format,
      });
    },
    getLocationIcon(resource, location) {
      if (
        resource.tags.indexOf(location.tag) < 0 &&
        resource.geo_tags != null &&
        resource.geo_tags.indexOf("global") < 0
      ) {
        return [];
      }

      return [
        {
          id: location.id,
          icon: 'mdi-checkbox-marked-circle',
          color: null,
        },
      ];
    },
    selectRegionLocations() {
      const regionIds = [];
      for (const geo of this.$store.state.config.geographies) {
        for (const region of geo.regions) {
          regionIds.push(region.id);
        }
      }
      this.selectedLocations = regionIds;
    },
    selectDatacenterLocations() {
      const dcIds = [];
      for (const geo of this.$store.state.config.geographies) {
        for (const dc of geo.datacenters) {
          dcIds.push(dc.id);
        }
      }
      this.selectedLocations = dcIds;
    },
    selectAllLocations() {
      this.selectedLocations = this.locations.map((location) => location.id);
    }
  },
});
</script>

<style>
.nameColumn {
  min-width: 400px !important;
}

tbody > tr:nth-of-type(odd) > td {
  background-color: #f7f7f7;
}

tbody > tr:nth-of-type(even) > td {
  background-color: white;
}

tbody > tr:hover > td {
  background-color: #eaeaea;
}

/* icon column is sticky */
table > thead > tr > th:nth-child(1),
table > tbody > tr > td:nth-child(1) {
  position: sticky !important;
  position: -webkit-sticky !important;
  left: 0px;
  z-index: 3 !important;
}

/* name column is sticky */
table > thead > tr > th:nth-child(2),
table > tbody > tr > td:nth-child(2) {
  position: sticky !important;
  position: -webkit-sticky !important;
  left: 48px;
  z-index: 3 !important;
}

/* headers stay on top */
table > thead > tr > th:nth-child(1),
table > thead > tr > th:nth-child(2) {
  z-index: 4 !important;
}
</style>