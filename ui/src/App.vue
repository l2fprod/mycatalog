<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title>My Catalog</v-toolbar-title>
    </v-app-bar>
    <v-main>
      <v-container fluid style="height: calc(100vh - 56px - 20px);">
        <v-layout fill-height>
          <ProductTable/>
        </v-layout>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import ProductTable from './components/ProductTable';

export default {
  name: 'App',

  components: {
    ProductTable,
  },

  data: () => ({
    //
  }),
};
</script>
