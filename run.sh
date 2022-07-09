#!/bin/bash
set -e

echo ">>> Cleaning docs directory..."
# clean the previous build
rm -rf \
  docs/generated \
  docs/css/chunk-vendors*.css \
  docs/css/index.*.css \
  docs/js/chunk-vendors*.js \
  docs/js/index*.js \
  docs/feed.xml \
  docs/index.html

echo ">>> Building the UI..."
# build the ui
(cd ui; yarn; yarn build)

# copy the ui files
cp -R ui/dist/* docs

echo ">>> Retrieving resources..."
# retrieve the services, and generate artifacts
(cd generate; yarn; node generate.js)
