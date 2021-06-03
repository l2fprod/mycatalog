<template>
  <div>
    <v-expansion-panels multiple accordion :tile="false" v-model="panels">
      <v-expansion-panel>
        <v-expansion-panel-header>
          <v-row style="padding: 0px 12px" align="center">
            <span>Filters</span>
            <span>&nbsp;&nbsp;<v-chip small>{{selectedFilters.length}}</v-chip></span>
          </v-row>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-chip-group multiple active-class="primary--text" v-model="selectedFilters"
          @change="setSelectedFilters"
          column>
            <v-chip v-for="filter in filters" v-bind:key="filter.id"
              small
              :value="filter"
            >
              {{ filter.label }}
            </v-chip>
          </v-chip-group>
        </v-expansion-panel-content>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-header>
          <v-row style="padding: 0px 12px" align="center">
            <span>Categories</span>
            <span>&nbsp;&nbsp;<v-chip small>{{selectedCategories.length}}</v-chip></span>
          </v-row>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-chip-group multiple active-class="primary--text" v-model="selectedCategories"
          @change="setSelectedCategories"
          column>
            <v-chip v-for="category in orderBy(categories, 'label')" v-bind:key="category.id"
              small
              :value="category"
            >
              {{ category.label }}
            </v-chip>
          </v-chip-group>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          <v-row style="padding: 0px 12px" align="center">
            <span>Regions</span>
            <span>&nbsp;&nbsp;<v-chip small>{{selectedRegions.length}}</v-chip></span>
          </v-row>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-chip-group multiple active-class="primary--text" v-model="selectedRegions"
          @change="setSelectedRegions"
          column>
            <v-chip v-for="region in orderBy(regions, 'label')" v-bind:key="region.id"
              small
              :value="region"
            >
              {{ region.label }}
            </v-chip>
          </v-chip-group>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Vue2Filters from 'vue2-filters'

export default Vue.extend({
  mixins: [Vue2Filters.mixin],
  data() {
    return {
      panels: [ 0, 1, 2 ],
      selectedCategories: [],
      selectedRegions: [],
      selectedFilters: [],
    }
  },
  computed: {
    regions() {
      return this.$store.state.config.regions
    },
    categories() {
      return this.$store.state.config.categories
    },
    filters() {
      return this.$store.state.config.filters
    }
  },
  methods: {
    setSelectedCategories(categories) {
      this.$store.commit('SET_SELECTED_CATEGORIES', categories);
    },
    setSelectedRegions(regions) {
      this.$store.commit('SET_SELECTED_REGIONS', regions);
    },
    setSelectedFilters(filters) {
      this.$store.commit('SET_SELECTED_FILTERS', filters);
    }
  }
})
</script>