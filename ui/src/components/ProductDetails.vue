<template>
  <v-navigation-drawer app clipped right width="400" v-if="resource">
    <template v-slot:prepend>
      <v-list-item two-line>
        <v-list-item-avatar size="64" :tile="false">
          <img :src="'/generated/icons/' + resource.id + '.png'"/>
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title>{{ resource.displayName }}</v-list-item-title>
          <v-list-item-subtitle>{{ resource.name }}</v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
          <v-btn icon @click="closeDetails">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </template>

    <v-divider></v-divider>

    <v-expansion-panels multiple accordion :tile="false" v-model="panels">
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
          Plans
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-select
            v-model="selectedPlan"
            return-object
            item-text="displayName"
            placeholder="Select a plan"
            :items="resource.plans">
            <template slot="selection" slot-scope="data">
              {{ data.item.displayName }} ({{ data.item.name }})
            </template>
            <template slot="item" slot-scope="data">
              {{ data.item.displayName }} ({{ data.item.name }})
            </template>
          </v-select>
          <v-text-field
            filled
            readonly
            label="Programmatic Name"
            :value="selectedPlan.name" v-if="selectedPlan"/>

          <v-textarea
            outlined
            readonly
            rows="4"
            label="Description"
            :value="selectedPlan.description" v-if="selectedPlan"/>

        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          CLI
        </v-expansion-panel-header>
        <v-expansion-panel-content v-if="selectedPlan">
          <div>
            <span class="subtitle-2">Cloud Foundry</span>
            <markup language="bash" v-bind:code='`ibmcloud cf create-service ${resource.name} \"${selectedPlan.originalName || selectedPlan.name }\" <service-name>`' />
          </div>
          <div>
            <span class="subtitle-2">Service Instance</span>
            <markup language="bash" v-bind:code='`ibmcloud resource service-instance-create <service-name> ${resource.name} \"${selectedPlan.name }\" <region>`' />
          </div>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          Terraform
        </v-expansion-panel-header>
        <v-expansion-panel-content v-if="selectedPlan">
          <markup language="hcl" v-bind:code='`resource \"ibm_resource_instance\" \"${resource.name}\" {
  name = \"\"
  service = \"${resource.name}\"
  plan = \"${selectedPlan.name }\"
  location = \"us-south\"
}`'/>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-navigation-drawer>
</template>

<script lang="ts">
import Vue from "vue";
import Markup from "./Markup.vue";

export default Vue.extend({
  data() {
    return {
      panels: [ 0, 1, 2, 3 ]
    }
  },
  components: {
    Markup
  },
  computed: {
    resource() {
      return this.$store.state.selectedResource;
    },
    selectedPlan() {
      return this.$store.state.selectedPlan;
    }
  },
  methods: {
    closeDetails() {
      this.$store.commit('SET_SELECTED_RESOURCE', null);
    }
  }
});
</script>