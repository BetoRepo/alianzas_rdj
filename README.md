# ⚜️ Aula Virtual Scout — Sistema de Gestión de Aprendizaje (LMS)

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-emerald?logo=supabase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-purple)

Plataforma interactiva de educación y seguimiento del plan de adelanto Scout. Diseñada para facilitar el aprendizaje de muchachos/as de tropa y brindar herramientas completas de administración a scouters y dirigentes.

---

## 📌 Tabla de Contenidos

1. [Visión General](#-visión-general)
2. [Estructura del Proyecto](#-estructura-del-proyecto)
3. [Tecnologías Utilizadas](#-tecnologías-utilizadas)
4. [Módulos y Funcionalidades](#-módulos-y-funcionalidades)
5. [Esquema de Base de Datos (Supabase)](#-esquema-de-base-de-datos-supabase)
6. [Instalación y Configuración](#-instalación-y-configuración)
7. [Configuración de Supabase Storage & Auth](#-configuración-de-supabase-storage--auth)
8. [Documentación de Componentes Clave](#-documentación-de-componentes-clave)
9. [Próximas Mejoras (Roadmap)](#-próximas-mejoras-roadmap)

---

## 🌟 Visión General

El **Aula Virtual Scout** es una aplicación web moderna orientada a la gamificación y progresión de jóvenes dentro del Movimiento Scout. Permite a los **Scouters/Dirigentes**:
- Administrar el catálogo de especialidades, cursos e insignias.
- Crear módulos interactivos enriquecidos con texto, imágenes, videos, presentaciones PowerPoint y documentos PDF.
- Diseñar cuestionarios evaluativos con explicaciones didácticas.
- Gestionar miembros, roles (Scout de Tropa, Scouter Dirigente) y accesos.

Para los **Scouts**:
- Consultar su plan de adelanto y progreso en tiempo real.
- Acceder a material multimedia en cualquier dispositivo (adaptación web y móvil).
- Evaluar sus conocimientos y obtener distintivos/insignias.

---

## 📁 Estructura del Proyecto

Se recomienda la siguiente arquitectura modular para el directorio `src/`:

```text
aula-virtual-scout/
├── public/
├── src/
│   ├── components/            # Componentes compartidos de interfaz
│   │   └── Sidebar.tsx        # Navegación lateral (Desktop) y Bottom Nav (Móvil)
│   ├── lib/                   # Configuración y clientes de APIs externas
│   │   └── supabase.ts        # Cliente inicializado de Supabase
│   ├── screens/               # Vistas principales de la aplicación
│   │   ├── AdminCursosScreen.tsx # Gestión de cursos, módulos, media y exámenes
│   │   ├── AdminDashboard.tsx    # Métricas y estadísticas en tiempo real
│   │   ├── LoginScreen.tsx       # Inicio de sesión, registro y recuperación
│   │   └── UsersScreen.tsx       # Control de usuarios y asignación de roles
│   ├── types/                 # Definiciones de TypeScript
│   │   └── index.ts           # Interfaces de Curso, Módulo, Usuario, etc.
│   ├── App.tsx                # Enrutador/Contenedor principal
│   └── main.tsx               # Punto de entrada React
├── .env.example               # Variables de entorno de muestra
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Tecnologías Utilizadas

- **Frontend Core:** React 18 + TypeScript / JSX
- **Estilos & UI:** Tailwind CSS, Lucide React (Iconografía), Fuentes personalizadas (*Nunito*, *Inter*, *JetBrains Mono*)
- **Backend as a Service (BaaS):** Supabase
  - **Auth:** Autenticación por Email/Contraseña y correo de recuperación.
  - **PostgreSQL Database:** Almacenamiento relacional de usuarios, perfiles, cursos y módulos.
  - **Storage:** Almacenamiento y servicio CDN de archivos subidos por Drag & Drop (imágenes, PDFs, PPTs).

---

## 🛠️ Módulos y Funcionalidades

### 🔐 1. Autenticación y Perfiles (`LoginScreen.jsx`)
- **Iniciar Sesión:** Acceso seguro con validación de credenciales.
- **Registro Scout:** Creación de cuenta en Supabase Auth + registro automático de perfil en la tabla `perfiles` con rol por defecto `user` ("Scout de Tropa").
- **Avatar Generativo:** Generación automática de iniciales del usuario para su foto de perfil.
- **Recuperación de Contraseña:** Envío de enlaces de restablecimiento de contraseña por correo electrónico.

### 📊 2. Dashboard Administrativo (`AdminDashboard.tsx`)
- **Conteo en Tiempo Real:** Métricas directas desde PostgreSQL (`count: 'exact'`) para usuarios registrados y cursos publicados.
- **Indicadores Clave:** Tasa de completado, métricas de retención y nuevas inscripciones.

### 📚 3. Gestión de Cursos y Módulos (`AdminCursosScreen.tsx`)
- **CRUD de Cursos:** Creación, edición y eliminación de cursos categorizados (*Liderazgo, Supervivencia, Valores, Naturaleza*).
- **Bloques de Contenido Multimedia:**
  - **Texto:** Redacción de explicaciones y teoría.
  - **Imágenes & Video:** Soporte para URLs externas y subida directa via **Drag & Drop** a Supabase Storage.
  - **Diapositivas:** Soporte para archivos `.pptx` / `.ppt`.
  - **Documentos PDF:** Visor integrado dentro del módulo.
- **Evaluaciones Interactivas (Quiz):**
  - Preguntas con selección de respuesta correcta (opciones 1 a 4).
  - Explicaciones pedagógicas tras responder.

### 👥 4. Gestión de Usuarios (`UsersScreen.tsx`)
- **Buscador en Tiempo Real:** Filtro de usuarios por nombre o correo electrónico.
- **Gestión de Roles:** Modal para registrar nuevos miembros asignando roles de **Scout de Tropa** o **Administradora (Scouter Dirigente)**.
- **Control de Acceso:** Eliminación y suspensión de perfiles.

### 📱 5. Navegación Adaptativa (`Sidebar.jsx`)
- **Escritorio:** Barra lateral completa con logotipo, ítems del menú y botón de cierre de sesión.
- **Dispositivos Móviles:** *Bottom Navigation Bar* fija en la parte inferior para navegación táctil fluida.
- **Filtrado por Rol:** Renderizado dinámico del menú según si el usuario es `admin` o `user`.

---

## 🗄️ Esquema de Base de Datos (Supabase)

### Tabla: `perfiles`
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` (PK, FK) | ID coincidente con `auth.users.id` |
| `name` | `TEXT` | Nombre completo del usuario |
| `email` | `TEXT` | Correo electrónico institucional |
| `role` | `TEXT` | `'admin'` \| `'user'` |
| `role_label` | `TEXT` | Ej: `"Scouter Dirigente"` o `"Scout de Tropa"` |
| `avatar` | `TEXT` | Iniciales o URL de imagen de perfil |
| `created_at` | `TIMESTAMP` | Fecha de creación del registro |

### Tabla: `cursos`
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `BIGINT` (PK) | Identificador único incremental |
| `title` | `TEXT` | Título del curso o insignia |
| `category` | `TEXT` | Categoría (Liderazgo, Supervivencia, etc.) |
| `description` | `TEXT` | Resumen del plan de estudios |
| `duration` | `TEXT` | Duración estimada (Ej: "6 semanas") |
| `img` | `TEXT` | URL de la portada del curso |
| `rating` | `NUMERIC` | Calificación promedio |
| `created_at` | `TIMESTAMP` | Fecha de creación |

### Tabla: `modulos`
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `BIGINT` (PK) | Identificador del módulo |
| `curso_id` | `BIGINT` (FK) | Relación con `cursos.id` |
| `title` | `TEXT` | Nombre del módulo |
| `duration` | `TEXT` | Duración estimada (Ej: "45 min") |
| `content` | `JSONB / TEXT` | Array serializado de bloques de contenido |
| `quiz` | `JSONB / TEXT` | Array serializado de preguntas y respuestas |
| `orden` | `INT` | Secuencia del módulo dentro del curso |

---

## ⚡ Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/aula-virtual-scout.git
cd aula-virtual-scout
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
```

### 4. Ejecutar el servidor de desarrollo
```bash
npm run dev
```

---

## ☁️ Configuración de Supabase Storage & Auth

1. **Bucket de Almacenamiento:**
   - Crear un bucket en Supabase Storage llamado `scout-storage` (o el configurado en `DEFAULT_STORAGE_BUCKET`).
   - Marcar el bucket como **Public** para que los recursos multimedia cargados en los bloques sean accesibles por los estudiantes.

2. **Políticas RLS (Row Level Security):**
   - Asegurar políticas de **Lectura (`SELECT`)** pública para la tabla `cursos` y `modulos`.
   - Permitir **Escritura (`INSERT`, `UPDATE`, `DELETE`)** únicamente a usuarios cuyo `role = 'admin'` en la tabla `perfiles`.

---

## 🧪 Próximas Mejoras (Roadmap)

- [ ] Migrar totalmente `LoginScreen.jsx` y `Sidebar.jsx` a TypeScript (`.tsx`).
- [ ] Implementar sistema de certificados/diplomas descargables en PDF al completar un curso.
- [ ] Añadir barra de progreso porcentual del alumno por insignia/módulo.
- [ ] Integrar notificaciones en tiempo real para eventos de tropa o entregas de tareas.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Siéntete libre de adaptarlo y usarlo para tu Grupo Scout o comunidad educativa.

*¡Siempre Listos!* ⚜️
