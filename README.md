# ⚜️ Aula Virtual Scout — Sistema de Gestión de Aprendizaje (LMS)

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-emerald?logo=supabase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-purple)

Plataforma interactiva de educación y seguimiento del plan de adelanto Scout. Diseñada para facilitar el aprendizaje de muchachos/as de tropa y brindar herramientas completas de administración a scouters y dirigentes.

---

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Módulos y Funcionalidades](#módulos-y-funcionalidades)
5. [Esquema de Base de Datos](#esquema-de-base-de-datos)
6. [Instalación y Configuración](#instalación-y-configuración)
7. [Configuración de Supabase](#configuración-de-supabase)
8. [Accesibilidad](#accesibilidad)
9. [Roadmap](#roadmap)

---

## Visión General

El **Aula Virtual Scout** es una aplicación web moderna orientada a la gamificación y progresión de jóvenes dentro del Movimiento Scout.

**Para Scouters/Dirigentes:**
- Administrar el catálogo de cursos e insignias
- Crear módulos interactivos con texto, imágenes, videos, PDF y PowerPoint
- Diseñar evaluaciones con preguntas y retroalimentación
- Gestionar miembros, roles y accesos

**Para Scouts:**
- Consultar progreso y insignias ganadas
- Acceder a material multimedia en cualquier dispositivo
- Evaluar conocimientos y obtener distintivos

---

## Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Estilos | Tailwind CSS 4 |
| Iconografía | Lucide React |
| Animaciones | Framer Motion (`motion`) |
| Búsqueda | cmdk |
| Diálogos | Radix UI AlertDialog |
| Notificaciones | Sonner (toasts) |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| Routing | React Router DOM 7 |

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── ui/                    # Componentes reutilizables
│   │   │   ├── ConfirmDialog.tsx  # Diálogo de confirmación (Radix)
│   │   │   ├── LoadingSpinner.tsx # Spinner + Skeleton loaders
│   │   │   └── ...
│   │   ├── Sidebar.tsx            # Navegación lateral colapsable
│   │   ├── LoginScreen.tsx        # Auth: login, registro, recuperación
│   │   ├── AdminCursosScreen.tsx  # CRUD cursos, módulos, evaluaciones
│   │   ├── AdminDashboard.tsx     # Métricas y estadísticas
│   │   ├── UsersScreen.tsx        # Gestión de usuarios y roles
│   │   ├── CommandPalette.tsx     # Búsqueda rápida (⌘K)
│   │   ├── ErrorBoundary.tsx      # Manejo de errores global
│   │   └── ...
│   ├── views/
│   │   ├── UserDashboard.tsx      # Dashboard del scout
│   │   ├── CatalogoScreen.tsx     # Catálogo de cursos disponibles
│   │   ├── CourseDetailScreen.tsx # Detalle de curso con módulos
│   │   ├── ModuleViewerScreen.tsx # Visor de módulos interactivos
│   │   ├── InsigniasScreen.tsx    # Badges y progreso
│   │   └── ProfileScreen.tsx      # Perfil de usuario
│   ├── lib/
│   │   ├── supabase.ts            # Cliente Supabase
│   │   ├── courses.ts             # Funciones de cursos
│   │   └── progress.ts            # Funciones de progreso
│   └── App.tsx                    # Router principal + layout
├── styles/
│   ├── theme.css                  # Paleta de colores Scout
│   └── index.css                  # Estilos globales + Tailwind
└── main.tsx                       # Entry point
```

---

## Módulos y Funcionalidades

### 1. Autenticación (`LoginScreen.tsx`)
- Login con email/contraseña vía Supabase Auth
- Registro con creación automática de perfil
- Recuperación de contraseña por email
- Avatar generado con iniciales del usuario

### 2. Dashboard (`AdminDashboard.tsx` / `UserDashboard.tsx`)
- Métricas en tiempo real desde PostgreSQL
- Conteo de usuarios, cursos, progreso
- Vista de insignias y cursos en progreso

### 3. Gestión de Cursos (`AdminCursosScreen.tsx`)
- CRUD completo de cursos con categorías
- Bloques de contenido: texto, imagen, video, PDF, PowerPoint
- Subida de archivos a Supabase Storage
- Evaluaciones con preguntas de opción múltiple

### 4. Catálogo y Detalle (`CatalogoScreen.tsx` / `CourseDetailScreen.tsx`)
- Listado filtrable de cursos disponibles
- Vista detallada con módulos, duración y progreso
- Generación de certificados al completar

### 5. Gestión de Usuarios (`UsersScreen.tsx`)
- Buscador en tiempo real
- Registro de nuevos miembros con roles
- Eliminación con diálogo de confirmación

### 6. Navegación (`Sidebar.tsx`)
- Sidebar colapsable (aparece al hover en escritorio)
- Bottom nav fijo en móvil
- Filtrado dinámico por rol
- Atajo ⌘K para búsqueda rápida

---

## Esquema de Base de Datos

### Tabla: `perfiles`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID (PK, FK) | Coincide con `auth.users.id` |
| `name` | TEXT | Nombre completo |
| `email` | TEXT | Correo electrónico |
| `role` | TEXT | `admin` o `user` |
| `role_label` | TEXT | Ej: "Scouter Dirigente" |
| `avatar` | TEXT | Iniciales o URL |
| `created_at` | TIMESTAMP | Fecha de creación |

### Tabla: `cursos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BIGINT (PK) | ID incremental |
| `titulo` / `title` | TEXT | Título del curso |
| `categoria` / `category` | TEXT | Categoría |
| `descripcion` / `description` | TEXT | Resumen |
| `duracion` / `duration` | TEXT | Duración estimada |
| `imagen_url` / `cover_image` | TEXT | URL de portada |
| `created_at` | TIMESTAMP | Fecha de creación |

### Tabla: `modulos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BIGINT (PK) | ID del módulo |
| `curso_id` | BIGINT (FK) | Relación con cursos |
| `titulo` / `title` | TEXT | Nombre del módulo |
| `duracion` / `duration` | TEXT | Duración estimada |
| `contenido` / `content` | JSONB | Bloques de contenido |
| `evaluacion` / `quiz` | JSONB | Preguntas y respuestas |
| `orden` | INT | Secuencia en el curso |

### Tabla: `progreso_modulo`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user_id` | UUID (FK) | Relación con perfiles |
| `module_id` | BIGINT (FK) | Relación con módulos |
| `completed_at` | TIMESTAMP | Fecha de finalización |

---

## Instalación y Configuración

```bash
# Clonar
git clone https://github.com/tu-usuario/aula-virtual-scout.git
cd aula-virtual-scout

# Instalar
npm install

# Configurar .env.local
echo "VITE_SUPABASE_URL=tu-url" > .env.local
echo "VITE_SUPABASE_ANON_KEY=tu-key" >> .env.local

# Ejecutar
npm run dev
```

---

## Configuración de Supabase

1. **Storage Bucket:** Crear bucket `scout-storage` (público)
2. **RLS Policies:**
   - SELECT público para `cursos` y `modulos`
   - INSERT/UPDATE/DELETE solo para `role = 'admin'`

---

## Accesibilidad

- **ARIA labels** en todos los botones solo-icono e inputs
- **Focus trap** en modales y paleta de comandos
- **LoadingSpinner** con estados de carga claros
- **ErrorBoundary** global para manejo de errores
- **Navegación por teclado** completa
- **Semantic HTML** con roles ARIA apropiados

---

## Roadmap

- [x] Paleta de colores Scout unificada
- [x] Sidebar colapsable con persistencia
- [x] Notificaciones con Sonner (reemplazo de alert())
- [x] Vista de insignias y progreso
- [x] Diálogos de confirmación con Radix UI
- [x] Barra de búsqueda con cmdk (⌘K)
- [x] Animaciones de transición con Framer Motion
- [x] Code splitting con React.lazy()
- [x] ARIA labels y focus trap
- [ ] Modo offline con Service Worker
- [ ] Exportar progreso a PDF
- [ ] Sistema de notificaciones push
- [ ] Dashboard con gráficos (Recharts)

---

## Licencia

Proyecto distribuido bajo licencia **MIT**. Adaptalo para tu Grupo Scout o comunidad educativa.

*¡Siempre Listos!* ⚜️
