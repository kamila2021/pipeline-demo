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

---

## 📁 Estructura del Proyecto

```
PROYECTO-INICIAL/
├── backend/                  # Servidor Express 5 & adaptador PostgreSQL 17
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── server.js         # Punto de entrada (Puerto 5001)
│       ├── app.js            # Instancia de Express 5 & Endpoint /health
│       ├── db/               # Conexión pool, esquema y seed SQL
│       ├── routes/           # Rutas RESTful (/api/tasks)
│       └── middleware/       # Captura asíncrona de errores Express 5
├── frontend/                 # Aplicación React 19 + Vite
│   ├── package.json
│   ├── vite.config.js        # Configuración de proxy HTTP
│   └── src/
│       ├── App.jsx           # Dashboard principal
│       ├── components/       # Componentes (SystemHealthBadge, TaskCard, etc.)
│       └── styles/           # Sistema de diseño CSS moderno
├── deploy/                   # Infraestructura y Configuración de Despliegue
│   ├── systemd/              # Servicio backend-taskdb.service
│   ├── nginx/                # Configuración Nginx Reverse Proxy (taskdb.conf)
│   └── check-health.sh       # Script de diagnóstico Bash para /health
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

## 🌟 Características Destacadas

- **Health Check Local (`/health`)**: Endpoint nativo de diagnóstico para Nginx y Systemd watchdog con métricas de RAM, Uptime y PostgreSQL 17.
- **Express 5 Native Async Handlers**: Control automático de errores asíncronos.
- **React 19 Rendering & Infra Widget**: Componente `SystemHealthBadge` para visualizar en tiempo real la salud de la infraestructura.
- **Nginx Reverse Proxy**: Enrutamiento optimizado para API `/api/`, salud `/health` y archivos estáticos SPA React.

