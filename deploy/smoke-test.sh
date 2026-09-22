#!/usr/bin/env bash
set -uo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:5001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:8080}"
COMPOSE_CMD="${COMPOSE_CMD:-docker compose}"
MAX_WAIT="${MAX_WAIT:-60}"

FAILED=0
fail() {
  echo "❌ $1"
  FAILED=1
}
pass() {
  echo "🟢 $1"
}

wait_for_healthy() {
  local container="$1"
  local waited=0
  while [[ $waited -lt $MAX_WAIT ]]; do
    status="$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "missing")"
    if [[ "$status" == "healthy" ]]; then
      pass "$container está healthy"
      return 0
    fi
    sleep 2
    waited=$((waited + 2))
  done
  fail "$container no llegó a healthy tras ${MAX_WAIT}s (estado: $status)"
  return 1
}

check_endpoint() {
  local name="$1" url="$2" expected_status="$3" expected_body="$4"
  local response status body
  response="$(curl -s -w '\n%{http_code}' "$url")"
  status="$(echo "$response" | tail -n1)"
  body="$(echo "$response" | sed '$d')"

  if [[ "$status" != "$expected_status" ]]; then
    fail "$name: esperaba HTTP $expected_status, recibió $status"
    return
  fi
  if [[ -n "$expected_body" ]] && [[ "$body" != *"$expected_body"* ]]; then
    fail "$name: respuesta no contiene '$expected_body' (body: ${body:0:200})"
    return
  fi
  pass "$name: HTTP $status ✓"
}

echo "=== 1. Esperando contenedores healthy ==="
wait_for_healthy backend-taskdb
wait_for_healthy frontend-taskdb

echo ""
echo "=== 2. Verificando endpoints (curl) ==="
check_endpoint "GET /health" "$BACKEND_URL/health" 200 '"status":"ok"'
check_endpoint "GET /api/health" "$BACKEND_URL/api/health" 200 '"status":"ok"'
check_endpoint "GET /api/tasks" "$BACKEND_URL/api/tasks" 200 '"success":true'
check_endpoint "GET /api/tasks/stats" "$BACKEND_URL/api/tasks/stats" 200 '"total"'
check_endpoint "GET /metrics" "$BACKEND_URL/metrics" 200 '# HELP'
check_endpoint "GET / (frontend)" "$FRONTEND_URL/" 200 ''

echo ""
echo "=== 3. Revisando logs recientes en busca de errores (Pino level 50/60) ==="
LOG_OUTPUT="$($COMPOSE_CMD logs --no-color --since 2m backend frontend postgres 2>&1)"
ERROR_LINES="$(echo "$LOG_OUTPUT" | grep -E '"level":(50|60)' || true)"
if [[ -n "$ERROR_LINES" ]]; then
  fail "Se encontraron líneas de error en los logs:"
  echo "$ERROR_LINES"
else
  pass "Sin errores de nivel error/fatal en los logs recientes"
fi

echo ""
echo "=== 4. Logs recientes (para revisión / artifact de CI) ==="
echo "$LOG_OUTPUT" | tail -n 50

echo ""
if [[ $FAILED -eq 0 ]]; then
  echo "✅ Smoke test passed"
  exit 0
else
  echo "❌ Smoke test failed"
  exit 1
fi
