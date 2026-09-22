#!/usr/bin/env bash

# =========================================================
# Script de Verificación de Salud Local (Nginx & Systemd)
# =========================================================

set -e

PORT="${PORT:-5001}"
HOST="${HOST:-http://localhost}"

echo "🔍 Iniciando diagnóstico de salud local en $HOST:$PORT..."
echo "--------------------------------------------------------"

# 1. Probar salud local directa del Backend Express
echo "📡 1. Verificando /health directo en el backend (Puerto $PORT)..."
HEALTH_RESPONSE=$(curl -s "$HOST:$PORT/health" || echo "FAILED")

if [[ "$HEALTH_RESPONSE" == "FAILED" ]]; then
    echo "❌ Error: El backend no está respondiendo en el puerto $PORT."
    echo "   Asegúrate de que el servicio systemd o npm run dev esté activo."
    exit 1
else
    echo "🟢 Respuesta del Backend:"
    echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' || echo "$HEALTH_RESPONSE"
fi

echo "--------------------------------------------------------"

# 2. Probar API Endpoint
echo "📡 2. Verificando /api/tasks..."
TASKS_STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" "$HOST:$PORT/api/tasks")

if [[ "$TASKS_STATUS" == "200" ]]; then
    echo "🟢 API /api/tasks respondiendo correctamente (HTTP 200 OK)."
else
    echo "⚠️ Advertencia: /api/tasks respondió con código HTTP $TASKS_STATUS."
fi

echo "--------------------------------------------------------"
echo "✅ Diagnóstico de salud finalizado con éxito."
