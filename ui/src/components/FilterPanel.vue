<template>
  <div>
    Filters


    <v-checkbox v-for="region in regions" v-bind:key="region.id" dense
      :label="`${region.label}`">
    </v-checkbox>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  computed: {
    regions() {
      return this.$store.state.config.regions
    }
  }
})
</script>