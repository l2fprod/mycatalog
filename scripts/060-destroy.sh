#!/bin/bash
ibmcloud target -g $(cd scripts/infrastructure && terraform output -raw resource_group_name)

ibmcloud ce project delete --name mycatalog --force --hard --wait