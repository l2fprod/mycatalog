#!/bin/bash
set -e

# bzip2 required by nodejs npm install (phantomjs-prebuilt extract)
# apt-get update
# apt-get install -y bzip2

# Prepare env
npm config delete prefix
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

. ~/.nvm/nvm.sh
nvm install 16.15.0

# Build new UI
npm install --global yarn

./run.sh

git add docs
git status

git config --global push.default simple
git config --global user.email "autobuild@not-a-dom.ain"
git config --global user.name "autobuild"

# use "skip ci" to avoid triggering Travis again
git commit -m '[skip ci] updates'

# push the changes
git push
