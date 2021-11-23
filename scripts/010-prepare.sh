#!/bin/bash
set -e

cd scripts/infrastructure
tfswitch
terraform init -no-color
terraform apply -auto-approve -no-color

COS_ENDPOINT=$(terraform output -json bucket | jq -r .s3_endpoint_public)
COS_BUCKET_NAME=$(terraform output -json bucket | jq -r .bucket_name)
COS_INSTANCE_ID=$(terraform output -json cos_key | jq -r '.credentials["resource_instance_id"]')
IAM_TOKEN=$(terraform output -json token | jq -r .iam_access_token)

ENABLE_STATIC_WEBSITE='<WebsiteConfiguration>
  <IndexDocument>
    <Suffix>index.html</Suffix>
  </IndexDocument>
</WebsiteConfiguration>'
ENABLE_STATIC_WEBSITE_MD5=$(echo -n "$ENABLE_STATIC_WEBSITE" | openssl dgst -md5 -binary | openssl enc -base64)

# enable the 
curl --fail \
  --location \
  --request PUT \
  "https://$COS_ENDPOINT/$COS_BUCKET_NAME?website" \
  --header "Authorization: $IAM_TOKEN" \
  --header "ibm-service-instance-id: $COS_INSTANCE_ID" \
  --header "Content-MD5: $ENABLE_STATIC_WEBSITE_MD5" \
  --header 'Content-Type: text/plain' --data-raw "$ENABLE_STATIC_WEBSITE"
