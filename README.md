# Portal de Solicitudes — Sin base de datos

Versión standalone que funciona sin Supabase. Los datos se guardan en memoria
(se resetean al reiniciar el servidor).

## Deploy en Render

### Backend
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Sin variables de entorno necesarias

### Frontend
- Build Command: `cd client && npm install && npm run build`
- Publish Directory: `./client/dist`

## Usuarios por defecto
| Email                | Contraseña | Rol   | Área  |
|----------------------|-----------|-------|-------|
| admin@empresa.com    | admin123  | admin | —     |
| rem@empresa.com      | rem123    | agent | Rem.  |
| ing@empresa.com      | ing123    | agent | Ing.  |
| sis@empresa.com      | sis123    | agent | Sis.  |
| ctrl@empresa.com     | ctrl123   | agent | Ctrl. |
| user@empresa.com     | user123   | user  | —     |

## Nota
Los usuarios y solicitudes se resetean al reiniciar.
Para persistencia, conecta Supabase (ver rama `with-supabase`).
