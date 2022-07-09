var catalogCategories = [
  {
    id: 'compute',
    label: 'Compute',
    tags: ['compute', 'compute_baremetal', 'openwhisk', 'vmware', 'virtualservers', 'is.placement-group' ],
    exclude: [],
  },
  {
    id: 'containers',
    label: 'Containers',
    tags: [ 'containers' ],
    exclude: [],
  },
  {
    id: 'network',
    label: 'Networking',
    tags: ['network', 'network_classic','network_interconnectivity', 'network_edge', 'network_vpc', 'vpc', 'is.composite' ],
    exclude: [ 'storage_vpc', 'storage' ],
  },
  {
    id: 'storage',
    label: 'Storage',
    tags: ['storage', 'storage_classic', 'storage_datamovement', 'storage_vpc' ],
    exclude: [ 'big_data' ],
  },
  {
    id: 'ai',
    label: 'AI / Machine Learning',
    tags: ['ai', 'watson'],
    exclude: [],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    tags: ['analytics', 'business_analytics', 'big_data', 'data_analytics', 'finance' ],
    exclude: [ 'data_management' ],
  },
  {
    id: 'blockchain',
    label: 'Blockchain',
    tags: ['blockchain'],
    exclude: [],
  },
  {
    id: 'databases',
    label: 'Databases',
    tags: ['databases', 'database', 'cldamqp', 'esql', 'data_management' ],
    exclude: [],
  },
  {
    id: 'devops',
    label: 'Developer Tools',
    tags: ['devops', 'dev_ops', 'containers' ],
    exclude: [ 'big_data' ],
  },
  {
    id: 'logging_monitoring',
    label: 'Logging and Monitoring',
    tags: [ 'logging_monitoring' ],
    exclude: [],
  },
  {
    id: 'integration',
    label: 'Integration',
    tags: ['integration'],
    exclude: [],
  },
  {
    id: 'iot',
    label: 'Internet of Things',
    tags: ['iot', 'internet_of_things'],
    exclude: [],
  },
  {
    id: 'security',
    label: 'Security',
    tags: ['security'],
    exclude: [],
  },
  {
    id: 'mobile',
    label: 'Mobile',
    tags: ['mobile', 'web_and_app' ],
    exclude: [],
  },
];

/**
 * Checks if the given resource matches the given category
 */
function matchesCategory(resource, category) {
  return resource.tags.filter(function(tag) {
    return category.tags.indexOf(tag) >= 0  ||
      category.tags.indexOf(resource.name) >= 0;
  }).length > 0;
}

var regions = [
  {
    id: "us-south",
    api: "api.ng.bluemix.net",
    console: "cloud.ibm.com",
    tag: "us-south",
    label: "Dallas"
  },
  {
    id: "us-east",
    api: "api.us-east.bluemix.net",
    console: "cloud.ibm.com",
    tag: "us-east",
    label: "Washington DC"
  },
  {
    id: "ca-tor",
    api: "api.ca-tor.bluemix.net",
    console: "cloud.ibm.com",
    tag: "ca-tor",
    label: "Toronto"
  },
  {
    id: "br-sao",
    api: "api.br-sao.bluemix.net",
    console: "cloud.ibm.com",
    tag: "br-sao",
    label: "Sao Paolo"
  },
  {
    id: "eu-gb",
    api: "api.eu-gb.bluemix.net",
    console: "cloud.ibm.com",
    tag: "eu-gb",
    label: "London"
  },
  {
    id: "eu-de",
    api: "api.eu-de.bluemix.net",
    console: "cloud.ibm.com",
    tag: "eu-de",
    label: "Frankfurt"
  },
  {
    id: "jp-osa",
    api: "api.jp-osa.bluemix.net",
    console: "cloud.ibm.com",
    tag: "jp-osa",
    label: "Osaka"
  },
  {
    id: "jp-tok",
    api: "api.jp-tok.bluemix.net",
    console: "cloud.ibm.com",
    tag: "jp-tok",
    label: "Tokyo"
  },
  {
    id: "kr-seo",
    api: "api.kr-seo.bluemix.net",
    console: "cloud.ibm.com",
    tag: "kr-seo",
    label: "Seoul"
  },
  {
    id: "au-syd",
    api: "api.au-syd.bluemix.net",
    console: "cloud.ibm.com",
    tag: "au-syd",
    label: "Sydney"
  },
  {
    id: "in-che",
    api: "api.au-syd.bluemix.net",
    console: "cloud.ibm.com",
    tag: "in-che",
    label: "Chennai"
  }
];
