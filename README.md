# A simple user interface to view all IBM Cloud services and export its content as Office documents

My Catalog uses the IBM Cloud catalog API to show an aggregated view of all services from the catalog.

![](./public/icons/screenshot-mycatalog.png)

## Develop locally

1. Start the backend
   ```
   cd mycatalog
   PORT=9080 nodemon
   ```
1. Start the frontend
   ```
   cd mycatalog/ui
   USE_LOCAL=true yarn serve
   ```

## License

My Catalog is licensed under the Apache License Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0).
