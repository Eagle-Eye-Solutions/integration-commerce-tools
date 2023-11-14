terraform {
  cloud {
    organization = "ApplyDigitalForEagleEye"

    workspaces {
      tags = ["commercetools"]
    }
  }

  required_providers {
    commercetools = {
      source = "labd/commercetools"
    }
  }

  required_version = ">= 1.1.2"
}