#!/bin/bash
# Prepare env
npm config delete prefix
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 8.9.4

# Retrieve resources
npm install
./retrieve.sh
rm -rf node_modules

# Push the app
if ! cf app $CF_APP; then
  cf push $CF_APP -f dev-manifest.yml
else
  OLD_CF_APP=${CF_APP}-OLD-$(date +"%s")
  rollback() {
    set +e
    if cf app $OLD_CF_APP; then
      cf logs $CF_APP --recent
      cf delete $CF_APP -f
      cf rename $OLD_CF_APP $CF_APP
    fi
    exit 1
  }
  set -e
  trap rollback ERR
  cf rename $CF_APP $OLD_CF_APP
  cf push $CF_APP -f dev-manifest.yml
  cf delete $OLD_CF_APP -f
fi
