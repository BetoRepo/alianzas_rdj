Supabase Storage setup (bucket `bucket`)

1) Variables de entorno
- Copia `.env.example` a `.env` y rellena `VITE_SUPABASE_ANON_KEY` con tu anon key.

2) Hacer el bucket privado (recomendado)
- Abre la consola de Supabase: https://app.supabase.com
- Selecciona tu proyecto (URL: https://jjhcwaopnwfevbuirxku.supabase.co)
- Ve a Storage → Buckets → selecciona `bucket` → Settings → desactiva `Public` (o ejecuta el SQL provisto).

3) Aplicar políticas SQL (si quieres control fino)
- Abre SQL Editor en Supabase y pega el contenido de `sql/supabase_storage_policies.sql`.
- Ejecuta. Esto hará que sólo usuarios autenticados puedan subir/leer/actualizar/borrar objetos del bucket.

4) Probar desde la app
- Arranca la app localmente (asegúrate de tener las variables en `.env`):

```bash
pnpm install
pnpm dev
```

- En la UI de administración, crea un módulo con tipo `Diapositivas (PowerPoint)` y sube un `.pptx`.
- El frontend usará `createSignedUrl` para obtener URLs temporales y el `AsyncIframe` incrustará el visor de Office.

5) Notas de seguridad
- Si quieres que las presentaciones sean accesibles públicamente sin signed-URLs, marca el bucket como `Public`.
- Para mayor seguridad mantén el bucket privado y usa `createSignedUrl` con TTL corto (p.ej. 3600s).

Si quieres, puedo:
- Generar el SQL con tu bucket ya nombrado y abrir un PR (he creado `sql/supabase_storage_policies.sql`),
- O bien intentar aplicar políticas vía supabase-cli si me proporcionas un `service_role` key (no recomendado por seguridad).