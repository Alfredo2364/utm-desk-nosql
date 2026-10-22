# UTM Desk NoSQL Cloud 🏫☁️

> Sistema integral y polimórfico de gestión de incidencias para campus universitario con arquitectura desacoplada, basado en **Node.js/Express**, **MongoDB Atlas (Mongoose)**, **Supabase Storage** y **React + Tailwind CSS**.

---

## 🏗️ Arquitectura del Sistema

```
                            ┌─────────────────────────────────────────┐
                            │      Frontend (React + Tailwind CSS)     │
                            │  • Dashboard de Bandeja con Filtros     │
                            │  • Vista Expediente GET /:codigo        │
                            │  • Uploader Drag & Drop (5MB JPG/PNG/PDF)│
                            └───────────────────┬─────────────────────┘
                                                │ REST API (JSON / FormData)
                                                ▼
                            ┌─────────────────────────────────────────┐
                            │        Backend (Node.js + Express)      │
                            │  • Multer en memoria (filtro 5MB)       │
                            │  • Manejador centralizado de errores    │
                            │  • Controladores modulares              │
                            └─────────┬─────────────────────┬─────────┘
                                      │                     │
                Mongoose ODM          │                     │ @supabase/supabase-js
       (Documentos Polimórficos)      │                     │ (Signed URLs 6 días)
                                      ▼                     ▼
                       ┌────────────────────────┐  ┌────────────────────────┐
                       │     MongoDB Atlas      │  │    Supabase Storage    │
                       │   (incidencias_campus) │  │  (Bucket Privado 6d)   │
                       └────────────────────────┘  └────────────────────────┘
```

---

## 🌟 Características Principales

1. **Esquema Polimórfico en MongoDB Atlas**:
   - La colección `incidencias_campus` adapta el subdocumento `detalle` según la categoría:
     - `computo_telecomunicaciones`: Información de hardware, dirección IP, MAC address, SO, software afectado y tipo de falla de red.
     - `infraestructura_mantenimiento`: Tipo de servicio (plomería, electricidad, cerrajería, etc.), descripción del daño, urgencia, corte de suministros y riesgos de seguridad física.
     - `sistemas_servicios_academicos`: Plataforma institucional (SICE, Moodle, Correo Institucional), módulo afectado, matrícula de estudiantes, URL del módulo y códigos de error HTTP.
   - **Subdocumentos Embebidos**:
     - `revisiones`: Historial completo de diagnósticos técnicos, cambios de estado y acciones tomadas.
     - `evidencias_adjuntas`: Metadatos, tipos MIME, tamaños en bytes y URLs firmadas de Supabase Storage.

2. **Almacenamiento Seguro en Supabase Storage**:
   - Reemplaza totalmente a Firebase.
   - Endpoint multipart/form-data con `multer` (límite 5MB, solo `.jpg`, `.png`, `.pdf`).
   - Sube el buffer directamente a un bucket privado.
   - Genera una **URL firmada con vigencia de 6 días** (`518,400 segundos`).
   - Registra atómicamente la evidencia en MongoDB Atlas mediante el operador `$push` en `evidencias_adjuntas`.

3. **Frontend React con Tailwind CSS**:
   - **Bandeja de Trabajo**: Tarjetas interactivas con badges de estado (colores dinámicos), nivel de prioridad, ubicación en campus (edificio y aula) y conmutador a vista de tabla.
   - **Filtros Avanzados**: Búsqueda en tiempo real por texto/código, filtro por categoría polimórfica y filtro por estado.
   - **Expediente Completo sin JOINs**: Vista detallada que aprovecha la estructura embebida de MongoDB con un solo llamado `GET /api/incidencias/:codigo`.
   - **Zona de Arrastre Drag & Drop**: Componente para adjuntar archivos con barra/spinner de carga y validación client-side de formato y tamaño (< 5MB).
   - **Sembrador de Datos (Demo Seed)**: Carga instantánea de tickets de prueba representativos para pruebas de evaluación.

---

## 📁 Estructura del Proyecto

```
utm-desk-nosql/
├── .gitignore                      # Protección estricta de credenciales y .env
├── README.md                       # Documentación técnica
│
├── backend/                        # API REST Node.js & Express
│   ├── .env.example                # Plantilla de variables de entorno
│   ├── package.json
│   └── src/
│       ├── config/
│       │   ├── db.js               # Conexión resiliente a MongoDB Atlas
│       │   └── supabase.js         # Cliente Supabase & URLs firmadas a 6 días
│       ├── models/
│       │   └── Incidencia.js       # Modelo Mongoose polimórfico y embebido
│       ├── middlewares/
│       │   ├── upload.js           # Multer en memoria (límite 5MB, JPG/PNG/PDF)
│       │   └── errorHandler.js     # Manejador centralizado de errores
│       ├── controllers/
│       │   └── incidenciasController.js # Lógica de negocio y MongoDB $push
│       ├── routes/
│       │   └── incidenciasRoutes.js     # Endpoints REST
│       ├── seed/
│       │   └── seedData.js         # Datos de prueba para el campus
│       └── server.js               # Servidor Express
│
└── frontend/                       # Aplicación React + Tailwind CSS
    ├── package.json
    ├── vite.config.js              # Proxy /api -> http://localhost:5000
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.jsx                 # Estado global y orquestación
        ├── main.jsx
        ├── index.css
        ├── services/
        │   └── api.js              # Cliente fetch y FormData para archivos
        └── components/
            ├── Navbar.jsx          # Barra superior con estado de servicios
            ├── Dashboard.jsx       # Bandeja de trabajo interactiva
            ├── IncidentCard.jsx    # Tarjeta de incidencia
            ├── IncidentDetailModal.jsx # Expediente completo (GET /:codigo)
            ├── PolymorphicDetail.jsx   # Renderizado dinámico según categoría
            ├── TimelineReviews.jsx     # Línea de tiempo de revisiones técnicas
            ├── EvidenceGrid.jsx        # Galería de imágenes y PDFs
            ├── EvidenceUploader.jsx    # Zona Drag & Drop con spinner
            └── NewIncidentModal.jsx    # Formulario polimórfico de creación
```

---

## 🚀 Puesta en Marcha

### 1. Clonar el repositorio y configurar variables de entorno

> **IMPORTANTE**: El archivo `.env` está ignorado en `.gitignore` para proteger tus claves en GitHub.

Crea un archivo `.env` dentro de la carpeta `backend/` basándote en `.env.example`:

```bash
cd backend
cp .env.example .env
```

Configura tus credenciales reales:
```env
PORT=5000
MONGO_URI=mongodb+srv://tu_usuario:tu_password@cluster0.mongodb.net/utm_desk_db?retryWrites=true&w=majority
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu_supabase_service_role_key
SUPABASE_BUCKET=evidencias-campus
```

### 2. Ejecutar el Backend

```bash
cd backend
npm install
npm run dev
```

El servidor estará escuchando en `http://localhost:5000`.

### 3. Ejecutar el Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abre tu navegador en `http://localhost:3000`.

---

## 📡 Endpoints de la API REST

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado del backend y servicios vinculados |
| `GET` | `/api/incidencias` | Listar incidencias con filtros (`categoria`, `estado`, `prioridad`, `search`) |
| `GET` | `/api/incidencias/:codigo` | Expediente completo embebido (sin JOINs) |
| `POST` | `/api/incidencias` | Crear nueva incidencia con detalle polimórfico |
| `POST` | `/api/incidencias/:codigo/evidencias/archivo` | Subir archivo a Supabase Storage y `$push` en MongoDB |
| `POST` | `/api/incidencias/:codigo/revisiones` | Agregar revisión técnica a la línea de tiempo |
| `POST` | `/api/incidencias/seed` | Poblar la base de datos con casos de prueba |

---

## 🛡️ Seguridad y Buenas Prácticas Implementadas

- **Protección de Secretos**: `.gitignore` configurado explícitamente para evitar la fuga accidental de `.env` a repositorios públicos.
- **Validación de Archivos en Dos Capas**: En el cliente (React) y en el servidor (Multer) se restringe el tamaño a un máximo de 5MB y tipos permitidos (`image/jpeg`, `image/png`, `application/pdf`).
- **URLs Firmadas Temporales**: Las evidencias se guardan en un bucket privado de Supabase Storage y se generan enlaces firmados temporales (vigencia de 6 días), evitando accesos no autorizados.
- **Polimorfismo NoSQL**: Aprovechamiento pleno de MongoDB Atlas para almacenar estructuras de datos variables sin esquemas rígidos ni tablas intermedias.
