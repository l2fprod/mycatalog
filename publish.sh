#!/bin/bash
set -e

# Build new UI
npm install --global yarn

./run.sh

git add docs
git status

# use "skip ci" to avoid triggering again
git commit -m '[skip ci] updates'

# push the changes
git push
