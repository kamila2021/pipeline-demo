# ⚡ Proyecto Fullstack: React 19 + Express 5 + PostgreSQL 17 + Systemd + Nginx

Este proyecto es una aplicación web fullstack moderna construida utilizando las tecnologías solicitadas:
- **Frontend**: React 19 + Vite
- **Backend**: Node.js 20+ + Express 5
- **Base de Datos**: PostgreSQL 17
- **Gestión de Servicios**: Systemd (`backend-taskdb.service`)
- **Reverse Proxy / Servidor Web**: Nginx (`taskdb.conf`)

---

## 🛠️ Requisitos Previos

- **Node.js**: `v22.0.0` o superior (requerido por vitest 5 y jsdom 30 en las devDependencies).
- **npm**: `v10.0.0` o superior.
- **PostgreSQL**: Instancia local o remota de **PostgreSQL 17** (Opcional para arrancar, ya que cuenta con un sistema de fallback in-memory automático si no hay DB activa inmediatamente).
- **Systemd & Nginx** *(Para entorno de producción Linux)*.
- **Docker Engine + Docker Compose v2** *(para levantar el stack completo con observabilidad — ver sección correspondiente)*.
- **OpenSSL** *(para generar el certificado HTTPS local; viene preinstalado en macOS y en la mayoría de distros Linux)*.

> **Nota de alcance**: este proyecto usa **Docker Compose únicamente — no Kubernetes**. Toda referencia a "logs de contenedor" se resuelve vía `docker compose logs`, no `kubectl logs`; no existen "pods" en este stack.

---

## 📁 Estructura del Proyecto

```
PROYECTO-INICIAL/
├── backend/                  # Servidor Express 5 & adaptador PostgreSQL 17
│   ├── package.json
│   ├── Dockerfile            # Imagen de producción del backend (node:22-alpine)
│   ├── .env
│   └── src/
│       ├── server.js         # Punto de entrada (Puerto 5001)
│       ├── app.js            # Instancia de Express 5 & Endpoint /health
│       ├── logger.js         # Logger estructurado (Pino)
│       ├── metrics.js        # Registro y métricas Prometheus (prom-client)
│       ├── db/               # Conexión pool, esquema y seed SQL
│       ├── routes/           # Rutas RESTful (/api/tasks)
│       └── middleware/       # Errores, logging y métricas por request
├── frontend/                 # Aplicación React 19 + Vite
│   ├── package.json
│   ├── Dockerfile            # Build multi-stage + Nginx (imagen de producción)
│   ├── vite.config.js        # Configuración de proxy HTTP
│   └── src/
│       ├── App.jsx           # Dashboard principal
│       ├── components/       # Componentes (SystemHealthBadge, TaskCard, etc.)
│       └── styles/           # Sistema de diseño CSS moderno
├── monitoring/                # Configuración de observabilidad
│   ├── prometheus/            # prometheus.yml (scrape config)
│   └── grafana/                # Datasource, dashboards y su provisioning
├── deploy/                   # Infraestructura y Configuración de Despliegue
│   ├── systemd/              # Servicio backend-taskdb.service
│   ├── nginx/                # taskdb.conf (producción) y taskdb.compose.conf (Docker Compose)
│   ├── tls/                  # generate-cert.sh (OpenSSL) — certs gitignorados
│   ├── smoke-test.sh         # Verificación funcional vía curl (local y CI)
│   └── check-health.sh       # Script de diagnóstico Bash para /health
├── docker-compose.yml         # postgres, backend, frontend, prometheus, grafana, cadvisor
└── README.md
```

---

## 🚀 Guía de Inicio Rápido (Desarrollo)

### 1. Configuración del Backend (Express 5 & PostgreSQL 17)

```bash
# Navegar a la carpeta backend
cd backend

# Instalar dependencias
npm install

# Iniciar el servidor backend Express 5
npm run dev

# Verificar salud local del backend
npm run health
```

El servidor Express 5 estará disponible en `http://localhost:5001`.

---

### 2. Configuración del Frontend (React 19 & Vite)

En una nueva terminal:

```bash
# Navegar a la carpeta frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo con Vite
npm run dev
```

La interfaz de usuario se abrirá en `http://localhost:3000`.

---

## ⚙️ Despliegue en Producción (Systemd & Nginx)

### 1. Configurar Systemd para el Backend

1. Copiar el archivo de unidad al directorio de Systemd:
   ```bash
   sudo cp deploy/systemd/backend-taskdb.service /etc/systemd/system/
   ```
2. Recargar y activar el servicio:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable backend-taskdb
   sudo systemctl start backend-taskdb
   sudo systemctl status backend-taskdb
   ```

### 2. Configurar Nginx Reverse Proxy

1. Copiar la configuración a Nginx:
   ```bash
   sudo cp deploy/nginx/taskdb.conf /etc/nginx/sites-available/
   sudo ln -s /etc/nginx/sites-available/taskdb.conf /etc/nginx/sites-enabled/
   ```
2. Validar y reiniciar Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 3. Verificar Salud Local y Enrutamiento

```bash
./deploy/check-health.sh
```

---

## 📊 Stack de Observabilidad (Docker Compose)

Levanta la app completa como contenedores, con métricas y logs centralizados.

```bash
# Solo la app (postgres + backend + frontend) — es lo mismo que corre el pipeline de CI
docker compose up -d --build postgres backend frontend

# Stack completo, incluyendo monitoreo continuo
docker compose up -d --build
```

- **Backend**: `http://localhost:5001` — endpoints `/health`, `/api/health`, `/api/tasks`, y `/metrics` (formato Prometheus).
- **Frontend**: `http://localhost:8080` (HTTP) — ver sección HTTPS más abajo para `https://localhost:8443`.
- **Prometheus**: `http://localhost:9090` — UI para queries PromQL ad-hoc y estado de los targets (`/targets`).
- **Grafana**: `http://localhost:3001` — usuario/clave por defecto `admin` / `admin` (cámbialos si esto corre más allá de tu máquina). El dashboard **"TaskDB Backend Overview"** se auto-provisiona con 4 paneles: CPU, memoria, tasa de error HTTP y latencia p95.
- **cAdvisor**: `http://localhost:8081` — métricas de CPU/memoria por contenedor (alimenta a Prometheus).

Logs de los contenedores: `docker compose logs -f [servicio]` (por ejemplo `docker compose logs -f backend`). El backend emite logs estructurados en JSON (vía Pino) — cada línea incluye `level` (30=info, 40=warn, 50=error, 60=fatal), lo que los hace fáciles de filtrar o alimentar a cualquier agregador de logs.

Para bajar todo: `docker compose down` (agrega `-v` si además quieres borrar los volúmenes de datos).

**Nota sobre Journald**: el unit de Systemd (`deploy/systemd/backend-taskdb.service`) ya envía stdout/stderr a `journald` (`StandardOutput=journal`) — eso aplica solo al despliegue de producción bare-metal, donde ahora esas líneas llegan como JSON estructurado de Pino (`journalctl -u backend-taskdb -f`). Docker Compose y el pipeline de CI no usan systemd dentro de los contenedores, así que ahí el mecanismo equivalente es `docker compose logs`.

---

## 🔒 HTTPS local con OpenSSL

El Nginx del contenedor `frontend` sirve tanto HTTP (puerto 8080) como HTTPS (puerto 8443) con un certificado self-signed.

```bash
# Generar el certificado una sola vez (idempotente, no lo regenera si ya existe)
bash deploy/tls/generate-cert.sh

# Luego, con los contenedores levantados:
# https://localhost:8443  (el navegador mostrará advertencia por ser self-signed; con curl usa -k)
```

Esto es independiente de la configuración de producción bare-metal (`deploy/nginx/taskdb.conf`, que sigue siendo HTTP-only) — certificados reales (p. ej. Let's Encrypt) para ese entorno quedan fuera de este alcance.

---

## ✅ Smoke Test / Verificación de Contenedores

`deploy/smoke-test.sh` valida que el stack realmente funcione como sistema corriendo, no solo que el código pase tests unitarios. Es el mismo script que ejecuta la etapa `verificar_stack` del pipeline de GitLab CI.

Qué verifica:
1. Que `backend-taskdb` y `frontend-taskdb` reporten estado `healthy`.
2. Que `/health`, `/api/health`, `/api/tasks`, `/api/tasks/stats`, `/metrics` y el frontend respondan con el status HTTP y forma de body esperados (vía `curl`).
3. Que no haya líneas de log de nivel error/fatal (Pino `level` 50/60) en los últimos minutos.
4. Vuelca los logs recientes de todos los servicios para revisión.

Para correrlo en local, después de levantar la app:
```bash
docker compose up -d --build postgres backend frontend
bash deploy/smoke-test.sh
```

---

## 🌟 Características Destacadas

- **Health Check Local (`/health`)**: Endpoint nativo de diagnóstico para Nginx y Systemd watchdog con métricas de RAM, Uptime y PostgreSQL 17.
- **Express 5 Native Async Handlers**: Control automático de errores asíncronos.
- **React 19 Rendering & Infra Widget**: Componente `SystemHealthBadge` para visualizar en tiempo real la salud de la infraestructura.
- **Nginx Reverse Proxy**: Enrutamiento optimizado para API `/api/`, salud `/health` y archivos estáticos SPA React.
- **Logging estructurado (Pino)**: logs JSON en producción, legibles con colores en desarrollo, silenciados automáticamente en tests.
- **Métricas Prometheus (`/metrics`)**: CPU, memoria, event loop, y métricas HTTP personalizadas (duración por ruta, conteo por código de estado) vía `prom-client`.
- **Dashboards Grafana auto-provisionados**: sin click-ops — datasource y dashboard se cargan solos al levantar el contenedor.
- **Smoke test automatizado en CI**: la etapa `verificar_stack` de GitLab CI levanta la app real en contenedores y valida endpoints, salud y logs antes de permitir el despliegue.

