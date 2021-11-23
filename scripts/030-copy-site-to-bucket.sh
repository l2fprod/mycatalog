#!/bin/bash
set -e -o pipefail

# get bucket credentials
COS_ACCESS_KEY=$(cd scripts/infrastructure && terraform output -json cos_key | jq -r '.credentials["cos_hmac_keys.access_key_id"]')
COS_SECRET_ACCESS_KEY=$(cd scripts/infrastructure && terraform output -json cos_key | jq -r '.credentials["cos_hmac_keys.secret_access_key"]')
COS_ENDPOINT=$(cd scripts/infrastructure && terraform output -json bucket | jq -r .s3_endpoint_public)
COS_BUCKET_NAME=$(cd scripts/infrastructure && terraform output -json bucket | jq -r .bucket_name)

# configure S3 client
mc config host add cos https://$COS_ENDPOINT $COS_ACCESS_KEY $COS_SECRET_ACCESS_KEY

# push the generated UI files
mc mirror -q --remove --preserve public/ cos/$COS_BUCKET_NAME/
