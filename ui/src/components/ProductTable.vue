<template>
  <v-data-table
    :headers="headers"
    :items="resources"
    height="100%"
    style="width: 100%"
    disable-pagination
    fixed-header
    hide-default-footer
    show-select
    @click:row="selectRow"
  >
    <template v-slot:item.icon="{item}">
      <img :src="'https://mycatalog.mybluemix.net/generated/icons/' + item.id + '.png'" width="16"/>
    </template>
    <template v-slot:item.name="{item}">
      {{ item.displayName }}
    </template>
    <template v-for="region in this.$store.state.config.regions" v-slot:[`item.${region.id}`]="{ item }">
      <v-icon v-bind:key="region.id" small v-if="(item.geo_tags != null && item.geo_tags.indexOf('global')>=0) || item.tags.indexOf(region.tag)>=0">mdi-checkbox-marked-circle</v-icon>
    </template>
    <template v-slot:item.tags="{item}">
      <v-chip v-if="item.tags.indexOf('ibm_created')>=0" label x-small color="primary">IBM</v-chip>
      <v-chip v-if="item.tags.indexOf('ibm_third_party')>=0" label x-small color="green" text-color="white">Third Party</v-chip>
      <v-chip v-if="item.tags.indexOf('ibm_beta')>=0" label x-small color="orange" text-color="white">Beta</v-chip>
      <v-chip v-if="item.tags.indexOf('ibm_experimental')>=0" label x-small color="red" text-color="white">Experimental</v-chip>
      <v-chip v-if="item.tags.indexOf('ibm_deprecated')>=0" label x-small color="red" text-color="white">Deprecated</v-chip>
      <v-chip v-if="item.pricing_tags && item.pricing_tags.indexOf('free')>=0" label x-small color="secondary">Free plan</v-chip>
      <v-chip v-if="item.pricing_tags && item.pricing_tags.indexOf('lite')>=0" label x-small color="secondary">Lite plan</v-chip>
      <v-chip v-if="item.geo_tags && item.geo_tags.indexOf('global')>=0" label x-small color="orange" text-color="white">Global</v-chip>
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
        value: "name",
        width: 200,
      },
    ];
    this.$store.state.config.regions.forEach(region => {
      headers.push(
        {
          text: region.label,
          value: region.id,
          align: "center",
          sortable: false,
          width: 50
        }
      );
    });
    headers.push({ text: "Tags", value: "tags", sortable: false });
    // { text: "Description", value: "description" },
    return {
      headers
    }
  },
  computed: {
    resources() {
      return this.$store.state.filteredResources
    }
  },
  methods: {
    selectRow(row) {
      this.$store.commit('SET_SELECTED_RESOURCE', row);
    }
  }
});
</script>