#!/usr/bin/env bash
set -euo pipefail

echo "Updating system packages..."
sudo dnf update -y

echo "Installing Nginx and unzip..."
sudo dnf install -y nginx unzip

echo "Enabling and starting Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

echo "Current Nginx status:"
sudo systemctl --no-pager --full status nginx | sed -n '1,12p'

echo
echo "Base installation completed."
echo "Next steps:"
echo "1. Copy the build zip to this instance."
echo "2. Extract it to /var/www/revive-sport."
echo "3. Copy revive-sport.conf to /etc/nginx/conf.d/."
echo "4. Run: sudo nginx -t && sudo systemctl restart nginx"
