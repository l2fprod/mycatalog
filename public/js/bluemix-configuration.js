var categories = [
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
];

var regions = [
  {
    id: "us",
    api: "api.ng.bluemix.net",
    serviceFilename: "public/generated/services.us-south.json",
    tag: "custom_datacenter_us",
    label: "US"
  },
  {
    id: "eu-gb",
    api: "api.eu-gb.bluemix.net",
    serviceFilename: "public/generated/services.eu-gb.json",
    tag: "custom_datacenter_eu-gb",
    label: "UK"
  },
  {
    id: "au-syd",
    api: "api.au-syd.bluemix.net",
    serviceFilename: "public/generated/services.au-syd.json",
    tag: "custom_datacenter_au-syd",
    label: "AU"
  }
];
