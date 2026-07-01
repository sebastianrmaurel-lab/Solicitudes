# 📋 Portal de Solicitudes y Preguntas

Plataforma interna para gestionar solicitudes, preguntas y consultas del equipo.

## Stack
- **Backend**: Node.js + Express
- **Frontend**: React + Vite
- **Base de datos**: Supabase (PostgreSQL)
- **Deploy**: Render

## Funcionalidades
- ✅ Registro e inicio de sesión (Supabase Auth)
- ✅ Crear solicitudes, preguntas, quejas y sugerencias
- ✅ Seguimiento de estado (abierta → en proceso → resuelta)
- ✅ Comentarios públicos y notas internas (solo staff)
- ✅ Panel de administración (usuarios, categorías, estadísticas)
- ✅ Notificaciones automáticas al cambiar estados
- ✅ Historial de cambios por solicitud
- ✅ Roles: usuario / agente / admin
- ✅ Filtros y búsqueda

---

## 🚀 Setup paso a paso

### 1. Supabase
1. Ve a [supabase.com](https://supabase.com) y crea un proyecto
2. En **SQL Editor**, pega y ejecuta todo el contenido de `supabase/schema.sql`
3. En **Project Settings → API**, copia:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `VITE_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
4. En **Authentication → URL Configuration**, agrega tu URL de Render como Site URL

### 2. Variables de entorno
Crea `server/.env`:
```
SUPABASE_URL=https://XXXXX.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
CLIENT_URL=https://solicitudes-frontend.onrender.com
NODE_ENV=production
PORT=3001
```

Crea `client/.env`:
```
VITE_SUPABASE_URL=https://XXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/solicitudes-app.git
git push -u origin main
```

### 4. Render
1. Ve a [render.com](https://render.com) y conecta tu repo de GitHub
2. Crea **Web Service** (backend):
   - Root Directory: `server`
   - Build: `npm install`
   - Start: `npm start`
   - Agrega las variables de entorno del `server/.env`
3. Crea **Static Site** (frontend):
   - Root Directory: `client`
   - Build: `npm install && npm run build`
   - Publish: `dist`
   - Agrega las variables de entorno del `client/.env`
4. Actualiza `CLIENT_URL` en el backend con la URL del frontend

### 5. Primer admin
Después de registrarte, ejecuta en Supabase SQL Editor:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'tu@email.com';
```

---

## Desarrollo local
```bash
# Instalar dependencias
npm run install:all

# Levantar backend (puerto 3001)
npm run dev:server

# Levantar frontend (puerto 5173)
npm run dev:client
```
