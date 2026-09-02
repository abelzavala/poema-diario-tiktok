# 🗄️ Conectar Supabase — paso a paso

Tiempo: 10 minutos. Costo: **$0** (el plan gratuito sobra para esto).

---

## 1. Crear el proyecto

1. Entra a <https://supabase.com> → **Start your project** → inicia sesión con GitHub
2. **New project**
   - **Name:** `poema-diario`
   - **Database Password:** genera una y **guárdala en tu gestor de contraseñas**.
     No la vas a usar en este proyecto, pero si la pierdes no se recupera.
   - **Region:** `East US (North Virginia)` o la más cercana a ti
3. **Create new project** — tarda unos 2 minutos en aprovisionarse

---

## 2. Crear la tabla

1. En la barra lateral: **SQL Editor** → **New query**
2. Abre el archivo `Docs/supabase-schema.sql` de este proyecto
3. **Copia todo su contenido**, pégalo en el editor y presiona **Run**
4. Debe decir *Success. No rows returned*

Verifica en **Table Editor**: debe aparecer la tabla `poemas` con sus columnas.

---

## 3. Copiar las credenciales

1. Barra lateral: **Project Settings** (el engrane) → **API**
2. Copia dos cosas:

| Dato | Dónde está | Se ve así |
|---|---|---|
| **Project URL** | arriba de todo | `https://abcdefgh.supabase.co` |
| **service_role** | sección *Project API keys* | una cadena larga, hay que revelarla |

> ⚠️ **Usa la llave `service_role`, NO la `anon`.**
> La tabla tiene RLS activado sin políticas públicas: con la llave `anon`
> nadie puede leer ni escribir. La `service_role` salta esas reglas, y por eso
> **solo puede vivir en un servidor**. Nunca la pongas en código de navegador,
> en una app móvil, ni en un repositorio.

---

## 4. Ponerlas en tu proyecto

**En tu computadora** — agrega estas dos líneas a tu archivo `.env`:

```
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_SERVICE_KEY=pega-aqui-la-llave-service-role
```

**En GitHub** — <https://github.com/arzav97/poema-diario-tiktok/settings/secrets/actions>
→ **New repository secret**, dos veces:

| Name | Secret |
|---|---|
| `SUPABASE_URL` | tu Project URL |
| `SUPABASE_SERVICE_KEY` | tu llave service_role |

---

## 5. Probar

```powershell
npm run prueba
```

Busca en la salida la línea `🗄️  Registrado en Supabase`.

Luego entra a **Table Editor → poemas** en Supabase. Debe haber una fila con la
fecha de hoy, el poema, el tema y el estado `prueba`.

---

## Cómo consultar tus poemas después

En el **SQL Editor** de Supabase:

```sql
-- Los últimos 30 poemas
select * from poemas_recientes;

-- Solo los que sí se publicaron, con su link
select fecha, poema, tiktok_url
from poemas
where estado = 'publicado'
order by fecha desc;

-- Los días que fallaron y por qué
select fecha, error from poemas where estado = 'fallido';

-- Qué temas rinden mejor (cuando tengas métricas)
select tema, count(*) as publicaciones, round(avg(vistas)) as vistas_promedio
from poemas
where vistas is not null
group by tema
order by vistas_promedio desc;
```

---

## Sobre el link de TikTok

El campo `tiktok_url` puede quedar vacío. Upload-Post confirma que la
publicación se completó, pero **no está documentado** que devuelva la URL del
post. El código intenta leerla de tres formas distintas por si acaso.

Si al hacer la primera publicación real queda en blanco, hay dos salidas:
llenarlo a mano desde el Table Editor, o construir la URL a partir de tu
usuario y el `tiktok_post_id`, si es que ese sí llega.

Lo sabremos con certeza en la primera publicación de verdad.
