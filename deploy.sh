#!/bin/bash

# install CF CLI
wget https://s3.amazonaws.com/go-cli/releases/v6.12.4/cf-cli_amd64.deb -qO temp.deb && sudo dpkg -i temp.deb
rm temp.deb

cf api $CF_API
cf login --u $CF_USERNAME --p $CF_PASSWORD --o $CF_ORGANIZATION --s $CF_SPACE

# blue green deploy
if ! cf app $CF_APP; then
  if [ -z "$CF_APP_HOSTNAME" ]; then
    cf push $CF_APP -f $MANIFEST --no-start
  else
    cf push $CF_APP -f $MANIFEST --hostname $CF_APP_HOSTNAME --no-start
  fi
  cf start $CF_APP
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
  if [ -z "$CF_APP_HOSTNAME" ]; then
    cf push $CF_APP -f $MANIFEST --no-start
  else
    cf push $CF_APP -f $MANIFEST --hostname $CF_APP_HOSTNAME --no-start
  fi
  cf start $CF_APP
  cf delete $OLD_CF_APP -f
fi
