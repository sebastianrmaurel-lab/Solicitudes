# Portal de Solicitudes

Plataforma interna de solicitudes y preguntas dividida en 4 áreas.

## Stack
- **Backend**: Node.js + Express + Supabase (service role)
- **Frontend**: React + Vite
- **DB**: Supabase (PostgreSQL)
- **Deploy**: Render

## Setup

### 1. Supabase
1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a SQL Editor y ejecuta `supabase/schema.sql`
3. Anota tu `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `VITE_SUPABASE_ANON_KEY`
4. Crea el primer usuario admin en Authentication > Users, luego en la tabla `profiles` cambia su `role` a `admin`

### 2. GitHub
Sube este proyecto a un repositorio de GitHub.

### 3. Render — Backend
1. New Web Service → conecta el repo
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Variables de entorno:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CLIENT_URL` (URL del frontend)
   - `NODE_ENV=production`

### 4. Render — Frontend
1. New Static Site → conecta el mismo repo
2. Build Command: `cd client && npm install && npm run build`
3. Publish Directory: `./client/dist`
4. Variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Roles
- **admin**: Ve todo, gestiona usuarios y categorías
- **agent**: Ve solicitudes de su área asignada
- **user**: Ve y crea sus propias solicitudes

## Áreas
- `rem` — Remuneraciones
- `ing` — Ingreso de Antecedentes
- `sis` — Sistema de Antecedentes
- `ctrl` — Control y Seguimiento
