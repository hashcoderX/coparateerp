#!/usr/bin/env bash
set -euo pipefail

DOMAIN="pabasarasweets.codemint.space"
CONF_SRC="/var/www/pabasarasweets/deploy/${DOMAIN}.nginx.conf"
CONF_DST="/etc/nginx/sites-available/${DOMAIN}"
CONF_LINK="/etc/nginx/sites-enabled/${DOMAIN}"

if [[ ! -f "$CONF_SRC" ]]; then
  echo "Missing config: $CONF_SRC"
  exit 1
fi

sudo cp "$CONF_SRC" "$CONF_DST"
sudo ln -sfn "$CONF_DST" "$CONF_LINK"
sudo nginx -t
sudo systemctl reload nginx

echo "Nginx vhost enabled for $DOMAIN"
