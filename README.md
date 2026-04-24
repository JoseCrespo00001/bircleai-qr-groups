# bircleai-qr-groups

Mini-app para armar grupos al toque con un QR. Pensada para eventos presenciales.

**Flujo**: escaneo QR → pongo mi nombre → creo grupo / me uno / auto-match → todos ven en tiempo real quién se va sumando. Tope 5 por grupo.

- Stack: Next.js 15, React 19, TypeScript, Tailwind.
- Storage: Upstash Redis (efímero, TTL 24h).
- Realtime: Pusher Channels.
- Deploy: Vercel.

---

## Setup local

### 1. Clonar + instalar

```bash
pnpm install   # o npm install / yarn
```

### 2. Crear cuentas (free tier)

- **Upstash Redis** → https://upstash.com → crear DB → copiar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.
- **Pusher Channels** → https://pusher.com → crear app → copiar `app_id`, `key`, `secret`, `cluster`.

### 3. `.env.local`

Copiar `.env.example` → `.env.local` y pegar los valores:

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=us2
NEXT_PUBLIC_PUSHER_KEY=<mismo que PUSHER_KEY>
NEXT_PUBLIC_PUSHER_CLUSTER=us2
```

### 4. Correr

```bash
pnpm dev
```

Abrir http://localhost:3000.

---

## Deploy a Vercel

1. Pushear el repo a GitHub.
2. En Vercel, "New Project" → importar el repo.
3. Cargar las mismas env vars del paso anterior en Settings → Environment Variables.
4. Deploy. Listo.

---

## Cómo se usa

1. Entrar a `/` → click **Crear evento** → redirige a `/e/[code]/host` con el QR grande.
2. Proyectar la pantalla del host o compartir el link.
3. Cada participante escanea → cae en `/e/[code]` → pone su nombre → aparece el lobby.
4. Puede:
   - **Crear grupo**: abre un grupo con él adentro, otros pueden unirse.
   - **Auto-match**: lo mete en cualquier grupo con cupo, o crea uno nuevo si están todos llenos.
   - **Unirme**: elegir un grupo específico de la lista.
5. Todo se actualiza en tiempo real para todos.
6. A las 24h sin actividad, el evento desaparece solo.

---

## Arquitectura

```
app/
  page.tsx                        # landing (crear evento)
  e/[eventCode]/
    page.tsx                      # lobby
    host/page.tsx                 # QR para proyectar
  api/events/...                  # 6 rutas
components/                       # UI
hooks/
  use-identity.ts                 # userId + name en localStorage
  use-event.ts                    # SWR + Pusher + polling fallback
lib/
  redis.ts                        # Upstash client
  pusher-server.ts / pusher-client.ts
  event-store.ts                  # toda la lógica de grupos
  validation.ts                   # zod schemas + header parsing
  constants.ts                    # MAX=5, TTL=86400
types/event.ts
```

### Data model (Redis)

```
event:{code}:meta       JSON { createdAt }           TTL 24h
event:{code}:groups     SET de groupIds              TTL 24h
group:{code}:{id}       JSON { id, members[], createdAt }  TTL 24h
```

Cada mutation extiende el TTL.

### Identidad

No hay auth. Al poner el nombre, el cliente genera un `userId` con `nanoid(12)` y lo guarda en `localStorage` bajo `qrg:identity:{eventCode}`. Se manda en `x-user-id` + `x-user-name` headers.

Efímero y sin stakes: el servidor confía en el header.

---

## Limitaciones conocidas (v1)

- No hay admin / no se puede cerrar un grupo manualmente.
- Race condition leve en `joinGroup`: si 2 usuarios hacen POST simultáneo sobre un grupo con 1 cupo, pueden quedar 6 miembros por una fracción de segundo. Para escala mayor, mover `joinGroup` a un script Lua o usar WATCH/MULTI.
- Sin rate limit — abusivo pero aceptable para eventos cerrados.
- Un solo idioma (español).

---

## Próximos pasos posibles

- Nombres custom por grupo ("Equipo Rojo").
- Pantalla `/display` pensada para proyectar en pantalla gigante con animaciones al sumarse gente.
- Admin panel con PIN para cerrar evento / patear usuarios.
- Persistencia histórica (para stats de evento).
