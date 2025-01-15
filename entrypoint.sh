#!/bin/bash

set -e

npm install
apt-get update
apt-get install ghostscript graphicsmagick -y
BROWSER=chrome SELENIUM=chrome npm run test
