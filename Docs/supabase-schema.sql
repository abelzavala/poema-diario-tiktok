-- ═══════════════════════════════════════════════════════════════
--  Poema del Día · Esquema de base de datos
--  Pégalo completo en:  Supabase → SQL Editor → New query → Run
--
--  ORDEN DE COLUMNAS: cuándo → contenido → publicación → métricas
--  → auditoría. Postgres no permite reordenar columnas después
--  (ADD COLUMN siempre las pega al final), así que si agregas una
--  y el orden importa, hay que reconstruir la tabla.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.poemas (
  id            bigint generated always as identity primary key,

  -- ── Cuándo ───────────────────────────────────────────────────
  fecha         date        not null,          -- día de la generación
  hora          time,                          -- hora LOCAL (America/Mexico_City),
                                               -- no UTC: creado_en ya guarda el UTC

  -- ── El contenido ─────────────────────────────────────────────
  poema         text        not null,          -- los versos, con saltos de línea
  tema          text,
  versos        text[],                        -- los versos por separado
  modelo        text,                          -- qué IA lo escribió

  -- ── Publicación ──────────────────────────────────────────────
  estado        text        not null default 'pendiente'
                check (estado in ('pendiente','publicado','fallido','prueba')),
  caption       text,
  hashtags      text[],
  tiktok_url    text,                          -- se llena al publicar
  tiktok_post_id text,
  request_id    text,                          -- id de Upload-Post
  error         text,                          -- por qué falló, si falló

  -- ── Métricas (se llenan después) ─────────────────────────────
  vistas        integer,
  likes         integer,
  comentarios   integer,
  compartidos   integer,
  guardados     integer,
  metricas_al   timestamptz,

  -- ── Auditoría ────────────────────────────────────────────────
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table public.poemas is 'Registro de cada poema generado y publicado en TikTok';
comment on column public.poemas.estado is 'pendiente = generado sin publicar · publicado · fallido · prueba = corrida en modo dry-run';
comment on column public.poemas.hora is 'Hora local de México. NO hay unique sobre fecha: cada generación es su propia fila.';

-- ⚠️ NO poner `unique` en fecha. Antes lo tenía y el registro se hacía
--    con on_conflict=fecha: una segunda corrida el mismo día sobreescribía
--    el poema de la primera y se perdía sin aviso. Pasó el 2026-09-03.
--    Ahora cada generación inserta una fila nueva, y marcarPublicado /
--    marcarFallido se identifican por id, no por fecha.

create index if not exists poemas_fecha_idx  on public.poemas (fecha desc, hora desc);
create index if not exists poemas_estado_idx on public.poemas (estado);

-- Mantener actualizado_en al día automáticamente
create or replace function public.tocar_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en = now();
  return new;
end $$;

drop trigger if exists poemas_actualizado_en on public.poemas;
create trigger poemas_actualizado_en
  before update on public.poemas
  for each row execute function public.tocar_actualizado_en();

-- ── SEGURIDAD ──────────────────────────────────────────────────
-- RLS activado SIN políticas públicas: nadie puede leer ni escribir
-- con la llave publicable. El proyecto usa la llave secreta
-- (sb_secret_…, antes service_role), que salta RLS y vive solo en
-- los Secrets de GitHub.
alter table public.poemas enable row level security;

-- ── Vista de consulta rápida ───────────────────────────────────
drop view if exists public.poemas_recientes;
create view public.poemas_recientes as
  select fecha, hora, tema, poema, estado, tiktok_url, vistas, likes, guardados
  from public.poemas
  order by fecha desc, hora desc
  limit 60;
