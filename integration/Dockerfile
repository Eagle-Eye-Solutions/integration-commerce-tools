#!/bin/bash

###################
# BASE IMAGE
###################

FROM node:lts-alpine AS base

ENV YARN_VERSION=4.10.3

RUN corepack enable && corepack prepare yarn@${YARN_VERSION} --activate

###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM base AS development

WORKDIR /usr/src/app

COPY --chown=node:node --chmod=644 package*.json ./
COPY --chown=node:node --chmod=644 yarn.lock yarn.lock

RUN yarn install --frozen-lockfile

COPY --chown=node:node --chmod=644 . .

USER node

###################
# BUILD FOR PRODUCTION
###################

FROM base AS build

WORKDIR /usr/src/app

COPY package*.json ./

# In order to run `yarn run build` we need access to the Nest CLI which is a dev dependency. In the previous development stage we ran `yarn ci` which installed all dependencies, so we can copy over the node_modules directory from the development image
COPY --from=development /usr/src/app/node_modules ./node_modules

COPY . .

RUN yarn build

RUN yarn workspaces focus --all --production && rm -rf "$(yarn cache clean)"

###################
# PRODUCTION
###################

FROM base AS production

COPY --chown=node:node --chmod=644 --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --chmod=644 --from=build /usr/src/app/dist ./dist

ENV NODE_ENV=production

# Define environment variables for Cloud Run
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080

WORKDIR /dist/src

CMD [ "node", "main.js" ]
