import Vue from 'vue'
import './plugins/axios'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import store from './store'

Vue.config.productionTip = false

store.commit('SET_CONFIG', {
  categories: catalogCategories,
  regions: regions,
  filters: [
    {
      "id": "custom_kind_iaas",
      "label": "IaaS",
    },
    {
      "id": "custom_kind_service",
      "label": "PaaS"
    },
    {
      "id": "ibm_created",
      "label": "IBM"
    },
    {
      "id": "ibm_third_party",
      "label": "Third party"
    },
    //  data-track-label="Production Ready" data-toggle="button" ng-click="toggleTagConfiguration('', false); toggleTagConfiguration('', false)"></button>
    {
      "id": "ibm_production_ready",
      "label": "Production Ready",
      "exclude": true,
      "tags": [
        "ibm_experimental",
        "ibm_beta"
      ]
    },
    {
      "id": "ibm_beta",
      "label": "Beta"
    },
    //  data-track-label="Experimental" data-toggle="button" ng-click="toggleTagConfiguration('', true)"><i class="fa fa-flask"></i>&nbsp;Experimental</button>
    {
      "id": "ibm_experimental",
      "label": "Experimental"
    },
    //  data-track-label="Deprecated" data-toggle="button" ng-click="toggleTagConfiguration('', true)"><i class="fa fa-exclamation-triangle"></i>&nbsp;</button>
    {
      "id": "ibm_deprecated",
      "label": "Deprecated"
    },
    //  data-track-label="Free plan" data-toggle="button" ng-click="toggleTagConfiguration('', true)"><i class="fa fa-usd"></i>&nbsp;</button>
    {
      "id": "free",
      "label": "Free plan"
    },
    //  data-track-label="Lite plan" data-toggle="button" ng-click="toggleTagConfiguration('', true)"><i class="fa fa-usd"></i>&nbsp;</button>
    {
      "id": "lite",
      "label": "Lite plan"
    },
    //  data-track-label="Syndicated" data-toggle="button" ng-click="toggleTagConfiguration('', true)" title="IBM public services visible in the dedicated and local catalogs"><i class="fa fa-cloud"></i>&nbsp;</button>
    {
      "id": "ibm_dedicated_public",
      "label": "Syndicated"
    },
    //  data-track-label="IAM" data-toggle="button" ng-click="toggleTagConfiguration('', true)" title="IAM Compatible"></button>
    {
      "id": "iam_compatible",
      "label": "IAM Compatible"
    },
    //  data-track-label="RC" data-toggle="button" ng-click="toggleTagConfiguration('', true)" title="Resource Catalog Compatible"></button>
    {
      "id": "rc_compatible",
      "label": "RC Compatible"
    },
    //  data-track-label="EU supported" data-toggle="button" ng-click="toggleTagConfiguration('', true)" title="EU supported"></button>
    {
      "id": "eu_access",
      "label": "EU supported"
    },
    //  data-track-label="HIPAA" data-toggle="button" ng-click="toggleTagConfiguration('', true)" title="HIPAA"></button>
    {
      "id": "hipaa",
      "label": "HIPAA"
    },
    //  data-track-label="FS Validated" data-toggle="button" ng-click="toggleTagConfiguration('', true)" title="Financial Services Validated"></button>
    {
      "id": "fs_ready",
      "label": "FS Validated"
    },
  ],
});

import Vue2Filters from 'vue2-filters'
Vue.use(Vue2Filters)

new Vue({
  vuetify,
  store,
  render: h => h(App)
}).$mount('#app')
