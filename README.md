# Recursos del webinar

Landing para subir la retención del webinar: Juan muestra un QR en el vivo, la gente entra,
pone la contraseña que él dice en voz alta, deja sus datos y ve los SOPs bloqueados, que la
llevan a WhatsApp.

| Ruta         | QR del área | Qué pasa |
|--------------|-------------|----------|
| `/marketing` | Marketing   | Contraseña → formulario → SOPs con candado |
| `/ventas`    | Ventas      | Ídem |
| `/back-end`  | Back-end    | Ídem |
| `/admin`     | Equipo (PIN) | Desbloqueos, formularios y clicks a WhatsApp por área; tabla y CSV |

## Las tres vistas

1. **Contraseña.** Se valida en el backend, sin distinguir mayúsculas. Hoy es `ATV` para las
   tres. Se cambia en `backend/.env` (`PASSWORD_MARKETING`, `PASSWORD_VENTAS`,
   `PASSWORD_BACKEND`, o `PASSWORD_DEFAULT` para todas) y
   `docker compose up -d --force-recreate backend` — no hace falta rebuildear el frontend.
2. **Formulario** "Te voy a dar mis mejores 5 SOPs": número de WhatsApp, cuello de botella
   (opciones por área + Otro) y qué intentó.
3. **SOPs desenfocados** con candado. Cada uno apunta a `/api/recursos/<area>/whatsapp`, que
   suma el click y redirige a `wa.me/<WHATSAPP_NUMBER>` con un mensaje precargado.

El avance queda en `localStorage`: si alguien vuelve a escanear el QR, retoma donde estaba.
Los textos (opciones de cuello de botella, títulos de los SOPs) viven en
`frontend/src/content/areas.js`.

## Local

```bash
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.template .env   # completar ADMIN_PIN y WHATSAPP_NUMBER
.venv/bin/uvicorn main:app --reload --port 8021
```

```bash
cd frontend && npm install && npm run dev -- --port 5177
```

## Deploy (VPS 72.60.244.220)

DNS: registro `A recursos → 72.60.244.220` (TTL 14400). Los puertos de Docker están cerrados
desde internet: se entra solo por el nginx del host.

1. Código y `.env`:

   ```bash
   git clone https://github.com/Fayets/atv-landing-recursos-webinar.git /opt/atv-recursos
   cd /opt/atv-recursos && cp backend/.env.template backend/.env
   ```

   En `backend/.env`: `DB_PROVIDER=postgres` + las `DB_*` de la Neon compartida (las mismas que
   usan las otras apps) con `DB_SCHEMA=recursos`, `ADMIN_PIN`, `PASSWORD_DEFAULT=ATV` y
   `WHATSAPP_NUMBER=5491162626702`. Con SQLite adentro del contenedor se pierden los datos en
   cada rebuild.

2. Levantar: `docker compose up -d --build` → backend `127.0.0.1:8019`, frontend `127.0.0.1:8099`.
   Antes, confirmar que esos puertos estén libres: `docker ps --format '{{.Ports}}' | grep -E '8019|8099'`.

3. nginx del host, `/etc/nginx/sites-available/recursos.atvos.io`:

   ```nginx
   server {
       listen 80;
       server_name recursos.atvos.io;
       location / {
           proxy_pass http://127.0.0.1:8099;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   ```bash
   ln -s /etc/nginx/sites-available/recursos.atvos.io /etc/nginx/sites-enabled/
   nginx -t && systemctl reload nginx
   certbot --nginx -d recursos.atvos.io
   ```

4. Probar: `https://recursos.atvos.io/marketing`, `/ventas`, `/back-end` y `/admin`.

Actualizar: `git pull && docker compose up -d --build` (el `--build` no es opcional). Cambiar la
contraseña o el número: editar `backend/.env` y `docker compose up -d --force-recreate backend`
(`restart` no relee el `.env`).
