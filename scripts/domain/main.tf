terraform {
  required_providers {
    cloudflare = {
      source = "cloudflare/cloudflare"
      version = "3.4.0"
    }
  }
}

variable "cloudflare_api_token" {}
variable "app_url" {}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

data "cloudflare_zone" "domain" {
  name = "<DOMAIN>"
}

resource "cloudflare_record" "web" {
  zone_id = data.cloudflare_zone.domain.id

  name = "mycatalog"
  type = "CNAME"
  value = var.app_url
  proxied = true
}