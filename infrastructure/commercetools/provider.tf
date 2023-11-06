provider "commercetools" {
  api_url       = var.CTP_API_URL
  token_url     = var.CTP_AUTH_URL
  client_id     = var.CTP_CLIENT_ID
  client_secret = var.CTP_CLIENT_SECRET
  project_key   = var.CTP_PROJECT_KEY
  scopes        = var.CTP_SCOPES
}

variable "CTP_API_URL" {
  type = string
  default = "https://api.europe-west1.gcp.commercetools.com"
  description = "commercetools API URL"
}

variable "CTP_AUTH_URL" {
  type = string
  default = "https://auth.europe-west1.gcp.commercetools.com"
  description = "commercetools Authentication API URL"
}

variable "CTP_CLIENT_ID" {
  type = string
  description = "commercetools API Client ID"
  sensitive = true
}

variable "CTP_CLIENT_SECRET" {
  type = string
  description = "commercetools API Client secret"
  sensitive = true
}

variable "CTP_PROJECT_KEY" {
  type = string
  description = "commercetools API Client ID"
}

variable "CTP_SCOPES" {
  type = string
  description = "commercetools Client scopes"
}

variable "CPT_PROJECT_NAME" {
  type = string
  description = "commercetools environment project name"
}
