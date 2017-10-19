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
    id: "data_management",
    label: "Data"
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
    id: "network",
    label: "Network"
  },
  {
    id: "integration",
    label: "Integration"
  },
  {
    id: "finance",
    label: "Finance"
  }
];

var regions = [
  {
    id: "us",
    api: "api.ng.bluemix.net",
    console: "console.ng.bluemix.net",
    serviceFilename: "public/generated/services.us-south.json",
    planFilename: "public/generated/plans.us-south.json",
    tag: "us-south",
    label: "US"
  },
  {
    id: "eu-gb",
    api: "api.eu-gb.bluemix.net",
    console: "console.eu-gb.bluemix.net",
    serviceFilename: "public/generated/services.eu-gb.json",
    planFilename: "public/generated/plans.eu-gb.json",
    tag: "eu-gb",
    label: "UK"
  },
  {
    id: "eu-de",
    api: "api.eu-de.bluemix.net",
    console: "console.eu-de.bluemix.net",
    serviceFilename: "public/generated/services.eu-de.json",
    planFilename: "public/generated/plans.eu-de.json",
    tag: "eu-de",
    label: "DE"
  },
  {
    id: "au-syd",
    api: "api.au-syd.bluemix.net",
    console: "console.au-syd.bluemix.net",
    serviceFilename: "public/generated/services.au-syd.json",
    planFilename: "public/generated/plans.au-syd.json",
    tag: "au-syd",
    label: "AU"
  }
];
