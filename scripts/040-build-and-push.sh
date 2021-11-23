#!/bin/bash
docker build -t us.icr.io/mycatalog/web .

ibmcloud target -r us-south
ibmcloud cr login
docker push us.icr.io/mycatalog/web