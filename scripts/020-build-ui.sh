#!/bin/bash
set -e

npm config delete prefix
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
. ~/.nvm/nvm.sh

nvm install 15.14.0
npm install --global yarn

# clean up previous build if any
rm -rf \
  public/css/chunk-vendors.*.css \
  public/css/index.*.css \
  public/js/chunk-vendors.*.js \
  public/js/index.*.js \
  public/index.html \
  public/error.html

# build ui
(cd ui; yarn; yarn build)

# move ui to where it belongs
cp -r public/ui/* public
rm -rf public/ui
