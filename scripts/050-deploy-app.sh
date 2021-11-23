#!/bin/bash
ibmcloud target -g $(cd scripts/infrastructure && terraform output -raw resource_group_name)

if ! ibmcloud ce project get --name mycatalog; then
  ibmcloud ce project create --name mycatalog
else
  ibmcloud ce project select --name mycatalog
fi

ibmcloud ce registry delete --name registry-secret --force --ignore-not-found
ibmcloud ce registry create --name registry-secret \
  --server us.icr.io \
  --username iamapikey \
  --password $(cd scripts/infrastructure && terraform output -raw service_id_apikey)

if ! ibmcloud ce app get --name web; then
  ACTION=create
else
  ACTION=update
fi

ibmcloud ce app $ACTION --name web \
  --image us.icr.io/mycatalog/web \
  --registry-secret registry-secret \
  --cpu 0.125 \
  --memory 1G \
  --min-scale 1 \
  --max-scale 1 \
  --wait \
  --wait-timeout 600
