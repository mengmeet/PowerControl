#!/bin/bash

# check if jq is installed
if ! [ -x "$(command -v jq)" ]; then
  echo 'Error: jq is not installed.' >&2
  exit 1
fi

temp=$(mktemp -d)

# Download latest release
RELEASE=$(curl -s 'https://api.github.com/repos/mengmeet/PowerControl/releases/latest')
MESSAGE=$(echo "$RELEASE" | jq -r '.message')

if [[ "$MESSAGE" != "null" ]]; then
  echo "$MESSAGE" >&2
  exit 1
fi

RELEASE_VERSION=$(echo "$RELEASE" | jq -r '.tag_name')
RELEASE_URL=$(echo "$RELEASE" | jq -r '.assets[0].browser_download_url')

if [ -z "$RELEASE_VERSION" ] || [ -z "$RELEASE_URL" ]; then
  echo "Failed to get latest release info" >&2
  exit 1
fi


curl -L -o ${temp}/PowerControl.tar.gz "${github_prefix}${RELEASE_URL}"

echo "Installing PowerControl $RELEASE_VERSION"

if [ ! -f ${temp}/PowerControl.tar.gz ]; then
  echo "Failed to download PowerControl $RELEASE_VERSION" >&2
  exit 1
fi

# remove old version
chmod +w ${HOME}/homebrew/plugins
chmod -R +w ${HOME}/homebrew/plugins/PowerControl

rm -rf ${HOME}/homebrew/plugins/PowerControl || true

# Extract and restart plugin_loader
tar -xzf ${temp}/PowerControl.tar.gz -C ${HOME}/homebrew/plugins && sudo systemctl restart plugin_loader.service

# Cleanup
rm -f ${temp}/PowerControl.tar.gz

echo "PowerControl $RELEASE_VERSION installed"