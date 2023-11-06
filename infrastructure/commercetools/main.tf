resource "commercetools_tax_category" "my-tax-category" {
  name        = "standard"
  description = "Standard Tax Category"
  key         = "standard"
}

resource "commercetools_tax_category_rate" "standard-tax-category-UK" {
  tax_category_id   = commercetools_tax_category.my-tax-category.id
  name              = "20% VAT"
  amount            = 0.20
  included_in_price = true
  country           = "GB"
}

resource "commercetools_project_settings" "my-project" {
  name                         = var.CPT_PROJECT_NAME
  countries                    = ["GB"]
  currencies                   = ["GBP"]
  languages                    = ["en"]
  enable_search_index_products = true
}

resource "commercetools_product_type" "generic-product-type" {
  key         = "generic"
  name        = "generic"
  description = "Generic product type to create test products"
}

resource "commercetools_shipping_method" "standard" {
  key            = "standard-key"
  name           = "Standard delivery"
  description    = "Standard delivery"
  localized_name = {
    en = "Standard delivery"
  }
  localized_description = {
    en = "Standard delivery"
  }
  is_default      = true
  tax_category_id = commercetools_tax_category.my-tax-category.id
  predicate       = "1 = 1"
}

resource "commercetools_shipping_zone" "gb" {
  key         = "gb"
  name        = "GB"
  description = "United Kingdom"
  location {
    country = "GB"
  }
}

resource "commercetools_shipping_zone_rate" "my-shipping-zone-rate" {
  shipping_method_id = commercetools_shipping_method.standard.id
  shipping_zone_id   = commercetools_shipping_zone.gb.id

  price {
    cent_amount   = 500
    currency_code = "GBP"
  }

  free_above {
    cent_amount   = 10000
    currency_code = "GBP"
  }
}