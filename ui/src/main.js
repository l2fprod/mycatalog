import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import store from './store'

Vue.config.productionTip = false

import Vue2Filters from 'vue2-filters'
Vue.use(Vue2Filters)

new Vue({
  vuetify,
  store,
  render: h => h(App)
}).$mount('#app')
