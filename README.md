# A simple user interface to view all IBM Cloud services and export its content as Office documents

My Catalog uses the IBM Cloud catalog API to show an aggregated view of all services from the catalog.

![](./public/icons/screenshot-mycatalog.png)


## Develop locally

1. Grab the latest resources
   ```
   (cd generate; yarn; node generate.js)
   ```
1. Run a local web server
   ```
   http-server -p 9080 docs
   ```
1. Run the UI and code :)
   ```
   (cd ui; yarn; USE_LOCAL=true yarn serve)
   ```

## License

My Catalog is licensed under the Apache License Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0).
