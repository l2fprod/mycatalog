# providers
terraform {
  required_version = ">= 1.0"
  required_providers {
    ibm = {
      source = "IBM-Cloud/ibm"
    }
  }
}

provider "ibm" {
  region           = var.region
  ibmcloud_api_key = var.ibmcloud_api_key
}

data "ibm_iam_auth_token" "token" { }
data "ibm_iam_account_settings" "account" {}

# variables
variable "ibmcloud_api_key" {}
variable "region" {
  default = "us-south"
}
variable "tags" {
  default = [ "terraform", "mycatalog" ]
}

data "ibm_resource_group" "group" {
  name = "mycatalog"
}

locals {
  resource_group_id = data.ibm_resource_group.group.id
  resource_group_name = data.ibm_resource_group.group.name
  basename = "mycatalog"
}

resource "ibm_resource_instance" "cos" {
  name              = "mycatalog-cos"
  resource_group_id = local.resource_group_id
  service           = "cloud-object-storage"
  plan              = "standard"
  location          = "global"
  tags              = concat(var.tags, ["service"])  
}

resource "ibm_cos_bucket" "bucket" {
  bucket_name           = "mycatalog"
  resource_instance_id  = ibm_resource_instance.cos.id
  cross_region_location = "us"
  storage_class         = "smart"
}

resource "ibm_resource_key" "key" {
  name                 = "mycatalog-cos-key"
  resource_instance_id = ibm_resource_instance.cos.id
  role                 = "Writer"

  parameters = {
    HMAC              = true
  }
}

data "ibm_iam_access_group" "public_access" {
  access_group_name = "Public Access"
}

resource "ibm_iam_access_group_policy" "cos_public" {
  access_group_id = data.ibm_iam_access_group.public_access.groups.0.id

  roles = [ "Content Reader" ]

  resources {
    service = "cloud-object-storage"
    resource_instance_id = ibm_resource_instance.cos.guid
    resource_type = "bucket"
    resource = ibm_cos_bucket.bucket.bucket_name
  }
}

resource "ibm_iam_service_id" "id" {
  name        = local.basename
  description = "Used by ${local.basename}"
}

resource "ibm_iam_service_api_key" "key" {
  name = local.basename
  iam_service_id = ibm_iam_service_id.id.iam_id
}

resource "ibm_cr_namespace" "namespace" {
  name = "mycatalog"
  tags = var.tags
}

resource "ibm_iam_service_policy" "policy" {
  iam_service_id = ibm_iam_service_id.id.id
  roles          = ["Reader"]

  resources {
    service = "container-registry"
    region = var.region
    resource = ibm_cr_namespace.namespace.id
    resource_type = "namespace"
  }
}

output "cos_key" {
  value = ibm_resource_key.key
  sensitive = true
}

output "bucket" {
  value = ibm_cos_bucket.bucket
}

output "token" {
  value = data.ibm_iam_auth_token.token
  sensitive = true
}

output "bucket_url" {
  value = "${ibm_cos_bucket.bucket.bucket_name}.${replace(ibm_cos_bucket.bucket.s3_endpoint_public, "s3.", "s3-web.")}"
}

output "resource_group_name" {
  value = local.resource_group_name
}

output "service_id_apikey" {
  value = ibm_iam_service_api_key.key.apikey
  sensitive = true
}

output "cr_namespace" {
  value = ibm_cr_namespace.namespace.name
}
