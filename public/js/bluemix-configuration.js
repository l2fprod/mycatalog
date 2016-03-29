/*var categories = [
  "dev_ops",
  "big_data",
  "internet_of_things",
  "web_and_app",
  "mobile",
  "security",
  "watson",
  "data_management",
  "network",
  "integration"
];*/

var categories = [
  {
    id: "dev_ops",
    label: "DevOps"
  },
  {
    id: "big_data",
    label: "Data and Analytics"
  },
  {
    id: "business_analytics",
    label: "Business Analytics"
  },
  {
    id: "internet_of_things",
    label: "IoT"
  },
  {
    id: "web_and_app",
    label: "Web and Application"
  },
  {
    id: "mobile",
    label: "Mobile"
  },
  {
    id: "security",
    label: "Security"
  },
  {
    id: "storage",
    label: "Storage"
  },
  {
    id: "watson",
    label: "Watson"
  },
  {
    id: "data_management",
    label: "Data"
  },
  {
    id: "network",
    label: "Network"
  },
  {
    id: "integration",
    label: "Integration"
  }
];

var regions = [
  {
    id: "us",
    api: "api.ng.bluemix.net",
    console: "console.ng.bluemix.net",
    serviceFilename: "public/generated/services.us-south.json",
    tag: "custom_datacenter_us",
    label: "US"
  },
  {
    id: "eu-gb",
    api: "api.eu-gb.bluemix.net",
    console: "console.eu-gb.bluemix.net",
    serviceFilename: "public/generated/services.eu-gb.json",
    tag: "custom_datacenter_eu-gb",
    label: "UK"
  },
  {
    id: "au-syd",
    api: "api.au-syd.bluemix.net",
    console: "console.au-syd.bluemix.net",
    serviceFilename: "public/generated/services.au-syd.json",
    tag: "custom_datacenter_au-syd",
    label: "AU"
  }
];
