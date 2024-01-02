# integration-commerce-tools

`integration-commerce-tools` provides an integration between Eagle Eye Air and commercetools.
The integration is available to install with commercetools connect or can be customized and hosted on a different
provider.

## Supported features

* Promotions
* Voucher codes
* Settling of the transaction

## Overview

This repository provides a single Node JS application that can be deployed as an Extension module or a Subscription
module.

![alt text](integration/docs/images/ee-ct-integration-components.png "Integration components")

* The Extension module is triggered on cart updates and adds to the cart promotions
* The Subscription module is triggered when the order is updated and handles the settling of the transaction in Eagle
  Eye

## Plugin Installation

See the [plugin installation documentation](integration/docs/installation.md).

## How it works

See [how it works](integration/docs/how-it-works.md) section for all the details about the plugin internals.

## Plugin development and customization

The process of setting up commercetools can differ based on the specific implementation, and the integration needs may
also vary in each scenario. Due to these variations, the plugin is distributed as an open source application to
facilitate the integration of these systems. This way, individuals are able to freely download, host, and customize the
solution according to their distinct business needs.
See [plugin development and customization](integration/docs/development.md) documentation for all the details on how to
customize the plugin and how to get it running locally.

# Contributing Guides lines

To contribute to this project please see there guidelines here: [CONTRIBUTING](./CONTRIBUTING.md)
