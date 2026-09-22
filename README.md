# ⚡ Proyecto Fullstack: React 19 + Express 5 + PostgreSQL 17

Este proyecto es una aplicación web fullstack moderna construida utilizando las versiones solicitadas:
- **Frontend**: React 19 + Vite
- **Backend**: Node.js 20+ + Express 5
- **Base de Datos**: PostgreSQL 17

---

## 🛠️ Requisitos Previos

- **Node.js**: `v20.0.0` o superior.
- **npm**: `v10.0.0` o superior.
- **PostgreSQL**: Instancia local o remota de **PostgreSQL 17** (Opcional para arrancar, ya que cuenta con un sistema de fallback in-memory automático si no hay DB activa inmediatamente).

---

## 📁 Estructura del Proyecto

```
PROYECTO-INICIAL/
├── backend/                  # Servidor Express 5 & adaptador PostgreSQL 17
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── server.js         # Punto de entrada (Puerto 5000)
│       ├── app.js            # Instancia de Express 5
│       ├── db/               # Conexión pool, esquema y seed SQL
│       ├── routes/           # Rutas RESTful (/api/tasks)
│       └── middleware/       # Captura asíncrona de errores Express 5
├── frontend/                 # Aplicación React 19 + Vite
│   ├── package.json
│   ├── vite.config.js        # Configuración de proxy HTTP
│   └── src/
│       ├── App.jsx           # Dashboard principal
│       ├── components/       # Componentes modulares
│       └── styles/           # Sistema de diseño CSS moderno
└── README.md
```

---

## 🚀 Guía de Inicio Rápido

### 1. Configuración del Backend (Express 5 & PostgreSQL 17)

```bash
# Navegar a la carpeta backend
cd backend

# Instalar dependencias
npm install

# (Opcional) Configurar las credenciales en .env
# Editando DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

# (Opcional) Ejecutar el script SQL de migración y seed en PostgreSQL 17
npm run db:seed

# Iniciar el servidor backend Express 5
npm run dev
```

El servidor Express 5 estará disponible en `http://localhost:5000`.

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

## 🗄️ Esquema SQL para PostgreSQL 17

El archivo [`backend/src/db/schema.sql`](file:///Users/kamila/Desktop/PROYECTO-INICIAL/backend/src/db/schema.sql) contiene las especificaciones optimizadas para PostgreSQL 17:

```sql
CREATE TABLE tasks (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category VARCHAR(50) DEFAULT 'General',
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🌟 Características Destacadas

- **Express 5 Native Async Handlers**: Control automático de errores en funciones asíncronas sin necesidad de envoltorios manuales `try-catch` redundantes.
- **React 19 Rendering**: Arquitectura limpia con estado reactivo, hooks optimizados y rendering eficiente.
- **PostgreSQL 17 Resilient Connection**: Cliente `pg` con pool de conexiones optimizado y simulación en memoria cuando la DB aún no ha sido creada localmente.
- **Diseño Ultra Moderno**: Tema oscuro con efectos Glassmorphism, respuesta táctil/hover, badges de estado dinámicos e indicadores de métricas.
