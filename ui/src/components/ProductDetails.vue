<template>
  <v-navigation-drawer app clipped right width="400" v-if="resource">
    <template v-slot:prepend>
      <v-list-item two-line>
        <v-list-item-avatar size="64" tile="false">
          <img :src="'https://mycatalog.mybluemix.net/generated/icons/' + resource.id + '.png'"/>
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title>{{ resource.displayName }}</v-list-item-title>
          <v-list-item-subtitle>{{ resource.name }}</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </template>

    <v-divider></v-divider>

    <v-expansion-panels multiple accordion tile="false" v-model="panels">
      <v-expansion-panel>
        <v-expansion-panel-header>
          About
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          {{ resource.description }}
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          CLI
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-text-field filled
            label="create a resource instance"
            readonly
            value="ibmcloud resource service-instance-create BLAH BLAH BLAH"
          ></v-text-field>

          <v-text-field filled
            label="create a Cloud Foundry instance"
            readonly
            value="ibmcloud cf create-service BLAH BLAH BLAH"
          ></v-text-field>

        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          Terraform
        </v-expansion-panel-header>
        <v-expansion-panel-content>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-navigation-drawer>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data() {
    return {
      panels: [ 0 ]
    }
  },
  computed: {
    resource() {
      return this.$store.state.selectedResource;
    },
  },
});
</script>