#!/bin/bash

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