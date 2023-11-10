# Commercetools infrastructure

Infrastructure code to configure commercetools product types, taxes, settings, shipping methods...

### Terraform cloud setup

**NOTE:** These steps should be done only once.

* Go to [app.terraform.io](https://app.terraform.io/)
* Create a project called `eagleeye-commercetools-plugin`
* Create two workspaces called `ee-ct-plugin-commercetools-dev`, `ee-ct-plugin-commercetools-prod`
* Configure the variables required
    * CTP_PROJECT_NAME
    * CTP_CLIENT_ID
    * CTP_CLIENT_SECRET
    * CTP_PROJECT_KEY
    *
  CTP_SCOPES: `manage_project_settings:eagleeye-connector-* manage_subscriptions:eagleeye-connector-* manage_extensions:eagleeye-connector-* manage_products:eagleeye-connector-* manage_api_clients:eagleeye-connector-* manage_orders:eagleeye-connector-* manage_shipping_methods:eagleeye-connector-*`
* Connect both workspaces to the GitHub repository, in terraform cloud open the workspace,
  click `settings` > `Version Control`, connect to GitHub and set the field `Terraform Working Directory`
  to `infrastructure/commercetools`

### Login to terraform cloud

Log in to Terraform Cloud via the CLI, run `terraform login` and follow the prompts to get an API token for
Terraform to use. If you don't have a Terraform Cloud account, you can create one during this step. More info
here https://developer.hashicorp.com/terraform/tutorials/cloud-get-started/cloud-login

### Using terraform

View available workspaces: `terraform workspace list`

Select workspace: `terraform workspace select ee-ct-plugin-commercetools-dev`

View plan `terraform plan`

Apply changes `terraform apply` 
