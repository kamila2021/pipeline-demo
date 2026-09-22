#!/usr/bin/env bash
set -euo pipefail

CERT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_FILE="$CERT_DIR/taskdb.crt"
KEY_FILE="$CERT_DIR/taskdb.key"

if [[ -f "$CERT_FILE" && -f "$KEY_FILE" ]]; then
  echo "Certificado ya existe en $CERT_DIR, omitiendo generación."
  exit 0
fi

openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout "$KEY_FILE" -out "$CERT_FILE" \
  -days 365 \
  -subj "/C=CL/ST=Local/L=Local/O=TaskDB/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "Certificado generado: $CERT_FILE / $KEY_FILE"
