# ⚡ TaskPulse Pro — De local a producción, paso a paso

Aplicación fullstack de gestión de tareas (React 19 + Express 5 + PostgreSQL 17), documentada como **guía de aprendizaje**: además de ser el README del proyecto, explica *por qué* se usa cada herramienta, cómo se arma un pipeline de CI/CD real, y cómo se lleva una app de "corre en mi laptop" a producción de verdad usando solo servicios gratuitos. Pensado para estudiantes/juniors que quieren ver el camino completo, no solo el resultado final.

**Demo en vivo**: [frontend en Vercel](https://pipeline-demo-self.vercel.app/) · backend en Render (`/health`, `/api/tasks`, `/metrics`)

---

## Índice

1. [Stack tecnológico y para qué sirve cada pieza](#-stack-tecnológico-y-para-qué-sirve-cada-pieza)
2. [Estructura del proyecto](#-estructura-del-proyecto)
3. [Requisitos previos](#-requisitos-previos)
4. [Desarrollo local](#-desarrollo-local)
5. [Testing: qué cubre cada capa](#-testing-qué-cubre-cada-capa)
6. [Observabilidad local (Prometheus + Grafana)](#-observabilidad-local-prometheus--grafana)
7. [HTTPS local con OpenSSL](#-https-local-con-openssl)
8. [El pipeline de CI/CD, explicado paso a paso](#-el-pipeline-de-cicd-explicado-paso-a-paso)
9. [Despliegue a producción gratis (Vercel + Render + Neon)](#-despliegue-a-producción-gratis-vercel--render--neon)
10. [Errores reales que nos encontramos (y cómo se resolvieron)](#-errores-reales-que-nos-encontramos-y-cómo-se-resolvieron)
11. [Alternativa: despliegue bare-metal con Systemd + Nginx](#-alternativa-despliegue-bare-metal-con-systemd--nginx)
12. [Características destacadas](#-características-destacadas)

---

## 🧰 Stack tecnológico y para qué sirve cada pieza

| Categoría | Herramienta | Para qué se usa aquí |
|---|---|---|
| Frontend | **React 19** | Construye la interfaz (componentes, estado, renderizado). |
| Frontend | **Vite** | Servidor de desarrollo con hot-reload y bundler de producción — compila `frontend/src` a archivos estáticos optimizados. |
| Backend | **Node.js 22 + Express 5** | API REST (`/api/tasks`). Express 5 propaga automáticamente errores async al middleware de errores, sin `try/catch` repetido en cada ruta. |
| Base de datos | **PostgreSQL 17** | Persistencia de las tareas. |
| Driver DB | **`pg`** | Cliente Node.js para hablar con Postgres (pool de conexiones). |
| Logging | **Pino** | Logging estructurado en JSON — cada línea es parseable por máquina, no solo texto para humanos. `pino-http` loguea cada request/response automáticamente. |
| Métricas | **Prometheus + `prom-client`** | El backend expone `/metrics` en formato Prometheus (CPU, memoria, latencia HTTP, tasa de errores); Prometheus las scrapea (las "recolecta") cada 10s. |
| Dashboards | **Grafana** | Visualiza lo que junta Prometheus en gráficos, sin escribir una sola línea de frontend para eso. |
| Métricas de contenedor | **cAdvisor** | CPU/memoria por contenedor Docker (complementa las métricas propias del backend). |
| Contenedores | **Docker + Docker Compose** | Empaqueta backend y frontend en imágenes reproducibles; Compose levanta todo el stack (app + monitoreo) con un solo comando. |
| Servidor web / proxy | **Nginx** | Sirve los archivos estáticos del frontend y reenvía `/api/*` al backend — así el navegador solo habla con un origen. |
| TLS local | **OpenSSL** | Genera un certificado self-signed para probar HTTPS en tu máquina antes de ir a producción (donde el certificado real lo dan Vercel/Render automáticamente). |
| Supervisor de procesos | **Systemd** | Alternativa "bare-metal": mantiene el backend corriendo en un servidor Linux tradicional (lo reinicia si se cae, lo levanta al bootear). |
| Testing backend | **Vitest + Supertest** | Tests unitarios/integración del backend, simulando requests HTTP sin levantar un servidor real. |
| Testing frontend | **Vitest + React Testing Library** | Tests de componentes React simulando el DOM. |
| CI/CD | **GitLab CI** | Automatiza: instalar dependencias → correr tests → levantar contenedores reales y probarlos → (des)plegar. |
| Docker-in-Docker | **`docker:dind`** | Permite que un job de GitLab CI (que ya corre dentro de un contenedor) pueda a su vez construir y correr *otros* contenedores. |
| Hosting frontend | **Vercel** | Aloja el build estático de Vite, gratis, con HTTPS y CDN automáticos. |
| Hosting backend | **Render** | Corre el `Dockerfile` del backend como servicio web gratis, con HTTPS automático. |
| Base de datos gestionada | **Neon** | Postgres gratis en la nube, sin necesidad de administrar un servidor de base de datos. |

---

## 📁 Estructura del proyecto

```
PROYECTO-INICIAL/
├── backend/                  # Servidor Express 5 & adaptador PostgreSQL 17
│   ├── package.json
│   ├── Dockerfile            # Imagen de producción del backend (node:22-alpine)
│   ├── .env.example
│   └── src/
│       ├── server.js         # Punto de entrada (Puerto 5001)
│       ├── app.js            # Instancia de Express 5, middlewares, rutas de health/metrics
│       ├── logger.js         # Logger estructurado (Pino)
│       ├── metrics.js        # Registro y métricas Prometheus (prom-client)
│       ├── config.js         # (frontend, ver abajo)
│       ├── db/                # Conexión pool (con soporte SSL/DATABASE_URL), esquema y seed SQL
│       ├── routes/           # Rutas RESTful (/api/tasks)
│       └── middleware/       # Errores, logging y métricas por request
├── frontend/                 # Aplicación React 19 + Vite
│   ├── package.json
│   ├── Dockerfile            # Build multi-stage + Nginx (imagen de producción)
│   ├── vite.config.js        # Proxy /api → backend en desarrollo local
│   └── src/
│       ├── App.jsx           # Dashboard principal
│       ├── config.js         # API_BASE: URL del backend (vacío en local, absoluta en producción)
│       ├── components/       # Componentes (SystemHealthBadge, TaskCard, etc.)
│       └── styles/           # Sistema de diseño CSS moderno
├── monitoring/                # Configuración de observabilidad
│   ├── prometheus/            # prometheus.yml (scrape config)
│   └── grafana/                # Datasource, dashboards y su provisioning automático
├── deploy/                   # Infraestructura y configuración de despliegue
│   ├── systemd/              # Servicio backend-taskdb.service (alternativa bare-metal)
│   ├── nginx/                # taskdb.conf (bare-metal) y taskdb.compose.conf (Docker Compose)
│   ├── tls/                  # generate-cert.sh (OpenSSL) — certs gitignorados
│   ├── smoke-test.sh         # Verificación funcional vía curl (local y CI)
│   └── check-health.sh       # Script de diagnóstico Bash para /health
├── docker-compose.yml         # postgres, backend, frontend, prometheus, grafana, cadvisor
├── .gitlab-ci.yml              # Pipeline: construir → probar → verificar → desplegar
└── README.md
```

---

## 🛠️ Requisitos previos

- **Node.js** `v22.12.0` o superior (lo exigen `vitest 5` y `jsdom 30` en las devDependencies — con Node 20 el `npm ci` funciona pero los tests fallan en runtime).
- **npm** `v10.0.0` o superior.
- **Docker Engine + Docker Compose v2** (para el stack completo local).
- **OpenSSL** (viene preinstalado en macOS y en casi todas las distros Linux).
- **PostgreSQL 17** local es *opcional*: el backend tiene un fallback automático a datos en memoria si no encuentra una base de datos al arrancar (útil para probar la API sin instalar nada más).

> **Nota de alcance**: este proyecto usa **Docker Compose únicamente — no Kubernetes**. "Logs de contenedor" se revisan con `docker compose logs`, no `kubectl logs`; no existen "pods" en este stack.

---

## 🚀 Desarrollo local

### Opción A — Stack completo con Docker (recomendado, igual a producción/CI)

```bash
# Solo la primera vez: generar el certificado HTTPS local
bash deploy/tls/generate-cert.sh

# Levantar todo (postgres, backend, frontend, prometheus, grafana, cadvisor)
docker compose up -d --build

# Confirmar que todo esté "healthy"
docker compose ps

# Verificación automatizada (lo mismo que corre el pipeline de CI)
bash deploy/smoke-test.sh
```

Para bajar todo: `docker compose down` (agrega `-v` para además borrar los datos).

Solo la app, sin monitoreo (más liviano, igual a lo que usa el CI):
```bash
docker compose up -d --build postgres backend frontend
```

### Opción B — Desarrollo nativo (hot reload, sin rebuild de Docker)

```bash
# Terminal 1: solo Postgres vía Docker
docker compose up -d postgres

# Terminal 2: backend
cd backend && npm install && npm run dev

# Terminal 3: frontend
cd frontend && npm install && npm run dev
```

### URLs una vez levantado

| Servicio | URL | Notas |
|---|---|---|
| Frontend (Docker/Nginx) | http://localhost:8080 | también https://localhost:8443 (cert self-signed) |
| Frontend (dev nativo) | http://localhost:3000 | Vite, hot reload |
| Backend API | http://localhost:5001 | `/health`, `/api/tasks`, `/metrics` |
| Grafana | http://localhost:3001 | usuario/clave: `admin` / `admin` |
| Prometheus | http://localhost:9090 | queries PromQL, `/targets` |
| cAdvisor | http://localhost:8081 | CPU/memoria por contenedor |

---

## 🧪 Testing: qué cubre cada capa

Un error común de quien empieza es pensar que "tests" es una sola cosa. Acá hay tres capas distintas, cada una responde una pregunta diferente:

| Capa | Herramienta | Pregunta que responde | Cómo correrla |
|---|---|---|---|
| Unitaria/integración backend | Vitest + Supertest | ¿La lógica de cada endpoint es correcta? (corre en memoria, sin contenedores) | `cd backend && npm test` |
| Unitaria componentes frontend | Vitest + React Testing Library | ¿Cada componente React renderiza y reacciona bien? (DOM simulado, sin navegador real) | `cd frontend && npm test` |
| Black-box / smoke test | Bash + curl | ¿La app *ya construida y corriendo en contenedores reales* responde como se espera? | `bash deploy/smoke-test.sh` (con los contenedores levantados) |

Las dos primeras prueban *código*; la tercera prueba *el sistema desplegado* — por eso el pipeline las corre en etapas distintas (`probar` primero, `verificar` después).

---

## 📊 Observabilidad local (Prometheus + Grafana)

- **Backend**: `/metrics` expone CPU, memoria, event loop, y métricas HTTP propias (duración por ruta, conteo por código de estado) vía `prom-client`.
- **Prometheus** (`http://localhost:9090`): scrapea `/metrics` del backend cada 10s y lo guarda como serie de tiempo.
- **Grafana** (`http://localhost:3001`, `admin`/`admin`): el dashboard **"TaskDB Backend Overview"** se auto-provisiona (sin click-ops) con 4 paneles: CPU, memoria, tasa de error HTTP y latencia p95.
- **cAdvisor** (`http://localhost:8081`): métricas de CPU/memoria por contenedor. *Nota: en Docker Desktop para Mac con el storage driver `containerd-snapshotter`, cAdvisor puede no reportar el desglose por contenedor (incompatibilidad conocida con versiones de cAdvisor más viejas) — no afecta el dashboard, que usa solo métricas propias del backend.*
- **Logs**: `docker compose logs -f [servicio]`. El backend loguea JSON estructurado vía Pino — cada línea trae `level` (30=info, 40=warn, 50=error, 60=fatal), fácil de filtrar o mandar a cualquier agregador de logs.
- **Journald** (solo en el despliegue bare-metal con Systemd): `journalctl -u backend-taskdb -f` — mismas líneas JSON de Pino, capturadas por `StandardOutput=journal` en el unit file.

---

## 🔒 HTTPS local con OpenSSL

```bash
bash deploy/tls/generate-cert.sh   # genera cert+key una sola vez (idempotente)
# https://localhost:8443  (el navegador avisará que es self-signed; con curl usa -k)
```

Es independiente del Nginx de producción bare-metal (`deploy/nginx/taskdb.conf`, que sigue siendo HTTP-only) — en Vercel/Render el HTTPS real lo dan las plataformas automáticamente, sin que tengas que tocar OpenSSL para nada.

---

## 🔁 El pipeline de CI/CD, explicado paso a paso

Un pipeline de CI/CD automatiza lo que harías a mano cada vez que cambias código: instalar dependencias, correr tests, y (opcionalmente) desplegar. `.gitlab-ci.yml` define 4 **etapas** (`stages`), que corren en orden; dentro de cada etapa hay uno o más **jobs**, que sí pueden correr en paralelo entre sí.

```
construir  →  probar  →  verificar  →  desplegar
```

### Etapa `construir`
- `construir_backend`: `npm ci --include=dev` en `backend/`.
- `construir_frontend`: instala dependencias y corre `npm run build` (compila el frontend a archivos estáticos).
- **Por qué `--include=dev`**: la variable global `NODE_ENV=production` hace que `npm ci` omita las `devDependencies` por defecto — pero `vite`, `vitest`, etc. son devDependencies necesarias para compilar y testear. Sin este flag, `npm run build` falla con "vite: not found".

### Etapa `probar`
- `probar_backend` / `probar_frontend`: corren `npm test` (Vitest) — ambos con `NODE_ENV=test`, para que la app no herede el `NODE_ENV=production` global (eso rompería el frontend: React carga su build de producción, que no incluye utilidades de testing).

### Etapa `verificar`
- `verificar_stack`: el paso más "real" del pipeline. Usa una imagen `docker:24-cli` con un **servicio** `docker:24-dind` (Docker-in-Docker) para poder construir y correr contenedores *dentro* de un job de CI. Levanta `postgres`, `backend` y `frontend` de verdad (con `docker compose up --wait`) y corre `deploy/smoke-test.sh` contra ellos — el mismo script que usas en local.
  - **Detalle importante de dind**: los contenedores reales viven en la red del servicio `docker:24-dind`, no en la del job. Por eso las URLs que usa el smoke test en CI apuntan a `http://docker:5001`, no a `http://localhost:5001` (ver la sección de errores más abajo).
- Prometheus/Grafana/cAdvisor **no se levantan en esta etapa a propósito**: un pipeline puede afirmar "sí/no" sobre un healthcheck, pero no "mirar" un dashboard — agregarlos solo sumaría contenedores pesados y fragilidad sin nada que verificar automáticamente.

### Etapa `desplegar`
- `desplegar_staging` / `desplegar_produccion`: hoy son principalmente informativos, porque el despliegue real lo disparan Render y Vercel solos al detectar un push a GitHub (ver siguiente sección) — son plataformas independientes de este pipeline de GitLab.

### Variables y mecanismos que vale la pena entender
- **`cache`**: reutiliza `node_modules/` entre jobs para no reinstalar todo cada vez.
- **`artifacts`**: pasa archivos generados por un job (ej. `frontend/dist/`) a los jobs siguientes.
- **`needs`**: define el orden real de dependencias entre jobs (más preciso que solo el orden de `stages`).
- **`rules`**: controla en qué ramas/eventos corre cada job (ej. `desplegar_produccion` solo corre, y de forma manual, en `main`).

---

## 🌐 Despliegue a producción gratis (Vercel + Render + Neon)

### Por qué esta arquitectura y no un VPS

Un VPS (servidor virtual propio) te da control total, pero *tú* eres el administrador de sistemas: instalar Node y Postgres, configurar el firewall, renovar certificados, aplicar parches de seguridad. Para alguien empezando, y sin presupuesto, conviene usar **plataformas administradas (PaaS)**: conectas tu repo de GitHub y ellas resuelven servidor, HTTPS y reinicios por ti.

| Pieza | Plataforma | Qué hace por ti |
|---|---|---|
| Frontend | **Vercel** | Compila `frontend/` en cada push y sirve los archivos estáticos con HTTPS + CDN. |
| Backend | **Render** | Construye `backend/Dockerfile` y corre el contenedor como servicio web con HTTPS automático. |
| Base de datos | **Neon** | Postgres gestionado, capa gratuita sin fecha de expiración. |

**Trade-off de la capa gratuita**: el backend en Render "se duerme" tras ~15 minutos sin tráfico; la primera petición después de eso tarda 20-30 segundos en responder mientras el contenedor arranca de nuevo (cold start). Para un proyecto de portafolio/aprendizaje es perfectamente aceptable.

### El cambio de arquitectura que esto exige: mismo origen vs. orígenes distintos

En local (y en Docker/CI), frontend y backend comparten origen: el proxy de Vite o Nginx hacen que `fetch('/api/tasks')` "simplemente funcione". En producción, Vercel y Render viven en **dominios distintos** — esa ruta relativa dejaría de encontrar el backend. Por eso:

- `frontend/src/config.js` exporta `API_BASE = import.meta.env.VITE_API_URL || ''` — vacío por defecto (mismo comportamiento de siempre en local), y con valor real solo en el build de Vercel.
- Cada `fetch(...)` del frontend quedó como `` fetch(`${API_BASE}/api/tasks`) `` en vez de `fetch('/api/tasks')`.
- El backend ya permite cualquier origen (`app.use(cors())`) — no hizo falta tocar nada ahí para que funcionen los requests cross-origin.

### Paso 1 — Neon (base de datos)
1. Crear cuenta en [neon.tech](https://neon.tech) y un proyecto nuevo.
2. Copiar el **Connection String** que te entrega (formato `postgresql://usuario:password@host.neon.tech/db?sslmode=require`).

### Paso 2 — Render (backend)
1. **New → Web Service**, conectar el repo de GitHub.
2. **Root Directory**: `backend` (Render auto-detecta el `Dockerfile` ahí dentro).
3. **Instance Type**: Free.
4. **Environment Variables**: `DATABASE_URL` (el de Neon), `NODE_ENV=production`, `LOG_LEVEL=info`.
5. **Health Check Path**: `/health`.
6. Deploy. Render te da una URL pública tipo `https://tu-backend.onrender.com`.

### Paso 3 — Vercel (frontend)
1. **Add New → Project**, importar el mismo repo.
2. **Root Directory**: `frontend` (⚠️ si Vercel detecta *dos* carpetas con `package.json` en el repo y te pide un `vercel.json` de "multi-servicio", es porque no fijaste el Root Directory a `frontend` — corrígelo ahí, no aceptes desplegar el backend también en Vercel, ya está en Render).
3. **Environment Variables**: `VITE_API_URL=https://tu-backend.onrender.com` (sin `/api` al final).
4. Deploy.

### Cómo soporta el backend conectarse a Neon

Los proveedores de Postgres gestionado exigen SSL y entregan una única connection string, no host/usuario/password sueltos. `backend/src/db/index.js` soporta ambos modos:

```js
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : { host: process.env.DB_HOST, /* ...variables sueltas, para local/CI */ };
```

Si `DATABASE_URL` está definida (Render/Neon), tiene prioridad; si no, usa las variables sueltas de siempre (local, Docker Compose, CI) — nada se rompió para esos entornos.

También el esquema de la base de datos se crea solo la primera vez que el backend arranca contra un Postgres nuevo (`CREATE TABLE IF NOT EXISTS ...` en `db/index.js`), así que no hace falta correr ningún script de migración a mano contra Neon.

---

## 🐛 Errores reales que nos encontramos (y cómo se resolvieron)

Esta sección es, a propósito, la más valiosa para quien está aprendiendo: son bugs reales de este proyecto, no ejemplos inventados.

**1. YAML: un `: ` dentro de un string sin comillas completas rompe el pipeline**
`- echo "Servicios objetivo: Systemd..."` — el `:` dentro de un string parcialmente entre comillas se interpreta como separador de mapping, no como texto. *Fix*: envolver la línea completa en comillas simples.

**2. `NODE_ENV=production` hace que `npm ci` omita las devDependencies**
`vite` es devDependency; con `NODE_ENV=production` seteado, `npm ci` la salta silenciosamente → `sh: vite: not found` al compilar. *Fix*: `npm ci --include=dev` para forzar su instalación sin importar `NODE_ENV`.

**3. El bundle de tests necesita `NODE_ENV=test`, no heredar `production`**
Con `NODE_ENV=production`, React carga su build de producción, que no trae `act` (usado por Testing Library) → `React.act is not a function`. *Fix*: override explícito `NODE_ENV: "test"` en el job de tests del frontend.

**4. Un simulador en memoria con una condición demasiado amplia**
El fallback sin Postgres tenía `if (query.startsWith('SELECT * FROM tasks'))` ANTES del chequeo específico por ID — como `'SELECT * FROM tasks WHERE id = $1'` también empieza así, siempre devolvía *todas* las tareas en vez de buscar por ID, y un 404 esperado terminaba devolviendo 200. *Fix*: revisar el caso específico antes que el genérico.

**5. Postgres recién creado no tenía el esquema**
Nada creaba la tabla `tasks` automáticamente — solo un script manual (`npm run db:seed`, que además borra todo). Cualquier Postgres fresco (un volumen nuevo, CI, Neon) fallaba con `relation "tasks" does not exist`. *Fix*: un bloque `CREATE TABLE IF NOT EXISTS` idempotente que corre solo al conectar, sin tocar datos existentes.

**6. Docker-in-Docker: `localhost` no es lo mismo que `localhost`**
En el job `verificar_stack`, los contenedores reales corren dentro del servicio `docker:24-dind` — un namespace de red *distinto* al del job. `docker inspect`/`docker compose logs` funcionan (van por la API vía `DOCKER_HOST`), pero `curl http://localhost:5001` desde el job no encuentra nada. *Fix*: apuntar al hostname del servicio (`http://docker:5001`), como documenta GitLab para este patrón.

**7. Una variable de entorno "inofensiva" que se activó sola**
`VITE_API_URL` estuvo declarada en el pipeline mucho antes de que el código la usara — sin efecto. Al conectarla de verdad (para el despliegue a Vercel/Render), ese valor viejo empezó a interferir con el test de `SystemHealthBadge`, que esperaba rutas relativas exactas (`/health`). *Fix*: quitar la variable del pipeline (no la necesita) y dejar que solo Vercel la configure, con el valor correcto de producción.

**Moraleja común a casi todos estos**: el entorno donde corre el código (tu laptop vs. CI vs. producción) cambia variables que parecen invisibles (`NODE_ENV`, si hay red compartida, si el volumen de datos es nuevo) — y esas diferencias son, en la práctica, la fuente más común de "en mi máquina funcionaba".

---

## ⚙️ Alternativa: despliegue bare-metal con Systemd + Nginx

Si en algún momento tienes un VPS propio (en vez de Vercel/Render), este proyecto también trae la configuración clásica de servidor Linux:

### 1. Configurar Systemd para el backend
```bash
sudo cp deploy/systemd/backend-taskdb.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable backend-taskdb
sudo systemctl start backend-taskdb
sudo systemctl status backend-taskdb
```

### 2. Configurar Nginx como reverse proxy
```bash
sudo cp deploy/nginx/taskdb.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/taskdb.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Verificar salud y enrutamiento
```bash
./deploy/check-health.sh
```

---

## 🌟 Características destacadas

- **Health Check (`/health`)**: diagnóstico con RAM, uptime y estado de PostgreSQL, pensado para watchdogs de Nginx/Systemd.
- **Express 5 Native Async Handlers**: errores async se propagan solos al middleware de errores.
- **Fallback en memoria**: la API sigue funcionando aunque no haya Postgres disponible al arrancar.
- **Logging estructurado (Pino)**: JSON en producción, coloreado en desarrollo, silencioso en tests.
- **Métricas Prometheus (`/metrics`)**: CPU, memoria, event loop, y métricas HTTP personalizadas.
- **Dashboards Grafana auto-provisionados**: sin click-ops, listos al levantar el contenedor.
- **Smoke test automatizado en CI**: `verificar_stack` levanta contenedores reales y valida endpoints, salud y logs antes de habilitar el despliegue.
- **Un solo código para tres entornos**: local, CI y producción usan el mismo `Dockerfile`, con SSL/DB configurable por variables de entorno.
