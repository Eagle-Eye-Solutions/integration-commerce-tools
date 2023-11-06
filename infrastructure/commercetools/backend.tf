# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

# The block below configures Terraform to use the 'remote' backend with Terraform Cloud.
# For more information, see https://www.terraform.io/docs/backends/types/remote.html
terraform {
  cloud {
    organization = "ApplyDigitalForEagleEye"

    workspaces {
      #      project = "eagleeye-commercetools-plugin"
      tags = ["commercetools"]
      #      prefix = "ee-ct-plugin-commercetools-"
    }
  }

  required_providers {
    commercetools = {
      source = "labd/commercetools"
    }
  }

  required_version = ">= 1.1.2"
}