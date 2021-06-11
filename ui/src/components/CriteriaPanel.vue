<template>
  <v-row>
    <v-col>
      <v-select
        v-model="selectedFilters"
        :items="filters"
        label="Filters"
        multiple
        chips
        deletable-chips
        small-chips
        hint="Show only resources matching these filters"
        persistent-hint
        item-text="label"
        return-object
      >
        <template v-slot:prepend-item>
          <v-list-item ripple @click="toggleFilters">
            <v-list-item-action>
              <v-icon
                :color="selectedFilters.length > 0 ? 'indigo darken-4' : ''"
              >
                {{
                  selectedFilters == 0
                    ? "mdi-checkbox-blank-outline"
                    : selectedFilters.length == filters.length
                    ? "mdi-close-box"
                    : "mdi-minus-box"
                }}
              </v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>Select All</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-divider class="mt-2"></v-divider>
        </template>
      </v-select>
    </v-col>
    <v-col>
      <v-select
        v-model="selectedCategories"
        :items="categories"
        label="Categories"
        multiple
        chips
        deletable-chips
        small-chips
        hint="Show only resources in these categories"
        persistent-hint
        item-text="label"
        return-object
      >
        <template v-slot:prepend-item>
          <v-list-item ripple @click="toggleCategories">
            <v-list-item-action>
              <v-icon
                :color="selectedCategories.length > 0 ? 'indigo darken-4' : ''"
              >
                {{
                  selectedCategories == 0
                    ? "mdi-checkbox-blank-outline"
                    : selectedCategories.length == categories.length
                    ? "mdi-close-box"
                    : "mdi-minus-box"
                }}
              </v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>Select All</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-divider class="mt-2"></v-divider>
        </template>
      </v-select>
    </v-col>
    <v-col>
      <v-select
        v-model="selectedRegions"
        :items="regions"
        label="Regions"
        multiple
        chips
        deletable-chips
        small-chips
        hint="Show only resources available in these regions"
        persistent-hint
        item-text="label"
        return-object
      >
        <template v-slot:prepend-item>
          <v-list-item ripple @click="toggleRegions">
            <v-list-item-action>
              <v-icon
                :color="selectedRegions.length > 0 ? 'indigo darken-4' : ''"
              >
                {{
                  selectedRegions == 0
                    ? "mdi-checkbox-blank-outline"
                    : selectedRegions.length == regions.length
                    ? "mdi-close-box"
                    : "mdi-minus-box"
                }}
              </v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>Select All</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-divider class="mt-2"></v-divider>
        </template>
      </v-select>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from "vue";

function convertIdToObject(selectedIds, allObjects) {
  const selectedObjects = [];
  allObjects.forEach((object) => {
    if (selectedIds.indexOf(object.id) >= 0) {
      selectedObjects.push(object);
    }
  });
  return selectedObjects;
}

export default Vue.extend({
  computed: {
    regions() {
      return this.$store.state.config.regions;
    },
    categories() {
      return this.$store.state.config.categories;
    },
    filters() {
      return this.$store.state.config.filters;
    },
    selectedFilters: {
      get: function () {
        return this.$store.state.selectedFilters;
      },
      set: function (selectedFilters) {
        this.$nextTick(() => {
          this.$store.commit("SET_SELECTED_FILTERS", selectedFilters);
        });
      },
    },
    selectedCategories: {
      get: function () {
        return this.$store.state.selectedCategories;
      },
      set: function (selectedCategories) {
        this.$nextTick(() => {
          this.$store.commit("SET_SELECTED_CATEGORIES", selectedCategories);
        });
      },
    },
    selectedRegions: {
      get: function () {
        return this.$store.state.selectedRegions;
      },
      set: function (selectedRegions) {
        this.$nextTick(() => {
          this.$store.commit("SET_SELECTED_REGIONS", selectedRegions);
        });
      },
    },
  },
  methods: {
    toggleFilters() {
      this.$nextTick(() => {
        if (this.selectedFilters.length == this.filters.length) {
          this.selectedFilters = [];
        } else {
          this.selectedFilters = this.filters.slice();
        }
      });
    },
    toggleCategories() {
      this.$nextTick(() => {
        if (this.selectedCategories.length == this.categories.length) {
          this.selectedCategories = [];
        } else {
          this.selectedCategories = this.categories.slice();
        }
      });
    },
    toggleRegions() {
      this.$nextTick(() => {
        if (this.selectedRegions.length == this.regions.length) {
          this.selectedRegions = [];
        } else {
          this.selectedRegions = this.regions.slice();
        }
      });
    },
  },
});
</script>
