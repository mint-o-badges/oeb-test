#!/bin/bash

set -e

npm ci
apt-get update
apt-get install ghostscript graphicsmagick -y
SELENIUM=chrome npm run test
