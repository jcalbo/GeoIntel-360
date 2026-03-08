# Especificación funcional y técnica — Blog editorial con Ink (shadcn)

## 1. Objetivo del proyecto

Construir una plataforma web tipo **blog/revista digital**, orientada a contenidos de **Noticias, Tecnología, Libros, Música, Varios y Repositorio**, con una experiencia visual basada en **Ink (shadcn)**, capacidad de ingestión de contenidos desde **RSS y APIs**, gestión editorial interna, autenticación local y con Google, control de acceso por roles, y backend soportado por **Elasticsearch** ejecutándose en la misma máquina en el puerto **9200**.

La aplicación debe poder operar como portal público de lectura y como plataforma privada de publicación/administración de contenidos.

---

# 2. Objetivos funcionales

La solución debe permitir:

1. Publicar y visualizar artículos y noticias en múltiples secciones.
2. Ingerir noticias automáticamente desde canales RSS y APIs externas.
3. Permitir autenticación mediante usuario/contraseña y Google OAuth.
4. Aplicar autorización por roles con tres perfiles: **Administrador**, **Usuario autenticado** y **Visitante**.
5. Permitir comentarios, fotos, enlaces y eventualmente subida de ficheros.
6. Disponer de una **consola administrativa** para carga y edición de contenidos.
7. Integrarse con servicios externos mediante **cliente y servidor MCP**.
8. Indexar y consultar contenidos en **Elasticsearch**.
9. Exponer contenido público con SEO adecuado y buscador.

---

# 3. Alcance inicial

## 3.1 Secciones iniciales

- Noticias
- Tecnología
- Libros
- Música
- Varios
- Repositorio

## 3.2 Tipos de contenido

### Artículo editorial
Creado manualmente desde consola.

Incluye:

- texto enriquecido
- imágenes
- enlaces
- etiquetas
- estado de publicación

### Noticia agregada

Obtenida desde:

- RSS
- APIs externas

Debe permitir:

- normalización
- deduplicación
- clasificación

### Comentario

- asociado a contenido
- creado por usuario autenticado

### Recurso de repositorio

- enlace externo o fichero
- categorizable

### Fichero adjunto

- accesible solo a usuarios autenticados si se configura.

---

# 4. Roles y autorización

## Visitante

Usuario no autenticado.

Permisos:

- ver contenido público
- navegar por secciones
- usar buscador
- leer comentarios

No puede:

- comentar
- subir contenido

---

## Usuario autenticado

Permisos:

- todo lo del visitante
- comentar contenidos
- añadir fotos
- añadir enlaces
- acceder a recursos restringidos
- subir ficheros (si está habilitado)
- editar su perfil

---

## Administrador

Permisos completos:

- crear, editar y eliminar contenidos
- administrar usuarios
- moderar comentarios
- configurar RSS y APIs
- reindexar Elasticsearch
- gestionar repositorio
- configurar MCP
- acceder a consola administrativa

---

# 5. Autenticación

## Métodos

1. Usuario / contraseña
2. Google OAuth

## Requisitos

- login
- logout
- registro (si se habilita)
- recuperación de contraseña
- verificación de email (opcional)

## Seguridad

- hash Argon2 o bcrypt
- cookies seguras
- protección CSRF
- rate limiting

---

# 6. Arquitectura

## Componentes

1. Frontend web
2. Backend API
3. Elasticsearch
4. Módulo ingestión RSS/API
5. MCP client
6. MCP server
7. Almacenamiento de ficheros

---

# 7. Stack tecnológico sugerido

## Frontend

- Next.js
- React
- Tailwind CSS
- shadcn/ui
- Ink design

## Backend

Opciones:

### Opción A

Next.js full stack

### Opción B

- Next.js frontend
- NestJS backend

---

# 8. UX / UI

## Principios

- diseño limpio
- tipografía legible
- tarjetas de contenido
- dark mode opcional

## Navegación

- Inicio
- Noticias
- Tecnología
- Libros
- Música
- Varios
- Repositorio
- Buscar
- Login / Perfil

---

# 9. Gestión de contenidos

El administrador puede:

- crear contenido
- editar contenido
- guardar borradores
- publicar
- programar publicación
- asignar sección
- asignar etiquetas
- subir imagen
- insertar imágenes
- insertar enlaces

Campos mínimos:

- id
- slug
- title
- summary
- body
- section
- tags
- author
- visibility
- status
- createdAt
- updatedAt

---

# 10. RSS y APIs

Capacidades:

- alta de fuentes
- edición de fuentes
- eliminación
- ejecución manual
- ejecución programada

Flujo:

1. leer fuente
2. parsear
3. transformar
4. deduplicar
5. clasificar
6. almacenar

---

# 11. Comentarios

Características:

- solo usuarios autenticados
- moderación
- estados
  - pendiente
  - aprobado
  - rechazado

---

# 12. Imágenes y ficheros

Validaciones:

- formato
- tamaño

Metadatos:

- nombre
- tipo MIME
- tamaño

---

# 13. Repositorio

Permite:

- enlaces externos
- documentos
- clasificación
- visibilidad pública o restringida

Tipos:

- documento
- enlace
- imagen
- audio
- video

---

# 14. Búsqueda

Basada en **Elasticsearch**.

Funciones:

- búsqueda full text
- filtrado por sección
- filtrado por tags
- orden por relevancia

---

# 15. Consola administrativa

Módulos:

- Dashboard
- Contenidos
- Noticias importadas
- RSS
- APIs
- Comentarios
- Usuarios
- Roles
- Repositorio
- Ficheros

Dashboard muestra:

- total contenidos
- actividad reciente
- estado importaciones

---

# 16. MCP Client / Server

## MCP Client

Permite:

- consumir servicios externos
- enriquecer contenido

## MCP Server

Expone:

- búsqueda
- artículos
- repositorio

---

# 17. Elasticsearch

Puerto:

```
9200
```

Uso:

- indexación artículos
- indexación noticias
- búsqueda

Índices sugeridos:

- content
- comments
- repository

---

# 18. Modelo de datos

## User

- id
- email
- username
- passwordHash
- role
- createdAt

## Content

- id
- title
- body
- section
- tags

## Comment

- id
- contentId
- authorId
- body

---

# 19. Seguridad

- sanitización HTML
- validación uploads
- rate limiting
- logs auditoría

---

# 20. Despliegue

Entorno inicial:

- una máquina
- Elasticsearch 9200

Servicios recomendados:

- app
- elasticsearch
- reverse proxy

Variables:

```
ELASTICSEARCH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
MEDIA_STORAGE_PATH
APP_BASE_URL
```

---

# 21. Criterios de aceptación

## Portal público

- secciones visibles
- contenidos visibles

## Autenticación

- login local
- login Google

## Consola

- crear contenido
- editar contenido

## RSS

- importar feeds

## Comentarios

- usuario puede comentar

## Repositorio

- crear recursos

---

# 22. Recomendación técnica

Arquitectura recomendada:

Frontend

- Next.js
- Tailwind
- shadcn

Backend

- Next.js API o NestJS

Persistencia

- Elasticsearch (contenido)
- PostgreSQL (usuarios y sesiones)

Media

- filesystem local

---

# 23. Entregables para el equipo

1. arquitectura detallada
2. modelo de datos
3. índices Elasticsearch
4. especificación API
5. diseño consola
6. pipeline RSS
7. MCP client/server
8. plan despliegue
9. plan de pruebas

