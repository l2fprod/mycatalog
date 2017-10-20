#!/bin/bash
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
