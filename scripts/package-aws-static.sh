#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/deploy-output"
PACKAGE_DIR="$OUT_DIR/train-gym-web-package"
ZIP_PATH="$OUT_DIR/train-gym-web-ec2.zip"

echo "Building application..."
(cd "$ROOT_DIR" && npm run build)

mkdir -p "$OUT_DIR"
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

cp -R "$ROOT_DIR/dist/." "$PACKAGE_DIR/"
cp "$ROOT_DIR/deploy/aws/windows/iis/web.config" "$PACKAGE_DIR/web.config"

rm -f "$ZIP_PATH"
(
  cd "$PACKAGE_DIR"
  zip -qr "$ZIP_PATH" .
)

echo "Package created:"
echo "$ZIP_PATH"
echo
echo "Linux target:"
echo "  unzip -o train-gym-web-ec2.zip -d /var/www/revive-sport"
echo
echo "Windows target:"
echo "  extract to C:\\inetpub\\wwwroot"
