<template>
  <div>
    <v-expansion-panels multiple accordion :tile="true" v-model="panels">
      <v-expansion-panel>
        <v-expansion-panel-header>
          <v-row style="padding: 0px 12px" align="center">
            <span>Filters</span>
            <span>&nbsp;&nbsp;<v-chip v-if="selectedFilters.length > 0" close small @click:close="setSelectedFilters([])">{{selectedFilters.length}}</v-chip></span>
          </v-row>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-chip-group multiple active-class="warning--text" v-model="selectedFilters"
          @change="setSelectedFilters"
          column>
            <v-chip v-for="filter in filters" v-bind:key="filter.id"
              small
              :value="filter"
              filter
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
            <span>&nbsp;&nbsp;<v-chip v-if="selectedCategories.length > 0" close small @click:close="setSelectedCategories([])">{{selectedCategories.length}}</v-chip></span>
          </v-row>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-chip-group multiple active-class="success--text" v-model="selectedCategories"
          @change="setSelectedCategories"
          column>
            <v-chip v-for="category in orderBy(categories, 'label')" v-bind:key="category.id"
              small
              :value="category"
              filter
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
            <span>&nbsp;&nbsp;<v-chip v-if="selectedRegions.length > 0" close small @click:close="setSelectedRegions([])">{{selectedRegions.length}}</v-chip></span>
          </v-row>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-chip-group multiple active-class="info--text" v-model="selectedRegions"
          @change="setSelectedRegions"
          column>
            <v-chip v-for="region in orderBy(regions, 'label')" v-bind:key="region.id"
              small
              :value="region"
              filter
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
      panels: [ 0, 1 ],
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
      this.selectedCategories = categories;
      this.$store.commit('SET_SELECTED_CATEGORIES', categories);
    },
    setSelectedRegions(regions) {
      this.selectedRegions = regions;
      this.$store.commit('SET_SELECTED_REGIONS', regions);
    },
    setSelectedFilters(filters) {
      this.selectedFilters = filters;
      this.$store.commit('SET_SELECTED_FILTERS', filters);
    }
  }
})
</script>