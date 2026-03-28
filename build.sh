#!/bin/bash
set -e

echo "==> Installing Chromium for Puppeteer..."
apt-get update -qq
apt-get install -y -qq chromium-browser libgbm1 libnss3 libxss1 libasound2 libatk-bridge2.0-0 libgtk-3-0 2>/dev/null || \
  apt-get install -y -qq chromium libgbm1 libnss3 libxss1 libasound2 libatk-bridge2.0-0 libgtk-3-0

if ! which chromium > /dev/null 2>&1; then
  if which chromium-browser > /dev/null 2>&1; then
    ln -sf "$(which chromium-browser)" /usr/local/bin/chromium
    echo "==> Created chromium symlink -> $(which chromium-browser)"
  fi
fi

echo "==> Chromium: $(which chromium)"
echo "==> Installing npm packages..."
npm install
echo "==> Build complete."
