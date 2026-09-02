-- ═══════════════════════════════════════════════════════════════
--  Poema del Día · Esquema de base de datos
--  Pégalo completo en:  Supabase → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.poemas (
  id            bigint generated always as identity primary key,

  -- ── Lo esencial ──────────────────────────────────────────────
  fecha         date        not null unique,   -- un poema por día
  poema         text        not null,          -- los versos, con saltos de línea
  tiktok_url    text,                          -- se llena al publicar

  -- ── Contexto de generación ───────────────────────────────────
  tema          text,
  versos        text[],                        -- los versos por separado
  modelo        text,                          -- qué IA lo escribió

  -- ── Publicación ──────────────────────────────────────────────
  estado        text        not null default 'pendiente'
                check (estado in ('pendiente','publicado','fallido','prueba')),
  caption       text,
  hashtags      text[],
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

-- Índices para las consultas que vas a hacer
create index if not exists poemas_fecha_idx  on public.poemas (fecha desc);
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
-- con la llave anónima. El proyecto usa la llave service_role, que
-- salta RLS y vive solo en los Secrets de GitHub.
alter table public.poemas enable row level security;

-- ── Vista de consulta rápida ───────────────────────────────────
create or replace view public.poemas_recientes as
  select fecha, tema, poema, estado, tiktok_url, vistas, likes, guardados
  from public.poemas
  order by fecha desc
  limit 60;
