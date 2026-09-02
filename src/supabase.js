/**
 * Registro de poemas en Supabase.
 *
 * PRINCIPIO DE DISEÑO: esto es documentación, no una pieza crítica.
 * Si Supabase está caído, el video igual se genera y se publica. Ninguna
 * función de este módulo lanza errores hacia arriba: avisan y siguen.
 *
 * Usa la API REST (PostgREST) directamente, sin librerías.
 * Docs: https://postgrest.org/en/stable/references/api.html
 */
import { cfg, log } from './config.js';

const activo = () => Boolean(cfg.supabaseUrl && cfg.supabaseKey);

function encabezados(extra = {}) {
  return {
    apikey: cfg.supabaseKey,
    Authorization: `Bearer ${cfg.supabaseKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function pedir(ruta, opciones = {}) {
  const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/${ruta}`;
  const r = await fetch(url, { ...opciones, headers: encabezados(opciones.headers) });
  const cuerpo = await r.text();
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${cuerpo.slice(0, 300)}`);
  return cuerpo ? JSON.parse(cuerpo) : null;
}

/**
 * Guarda (o actualiza, si ya existe ese día) el poema del día.
 * @returns true si quedó registrado
 */
export async function registrarPoema({ fecha, poema, tema, versos, modelo, caption, hashtags, estado }) {
  if (!activo()) return false;
  try {
    await pedir('poemas?on_conflict=fecha', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([{
        fecha, poema, tema, versos, modelo, caption, hashtags,
        estado: estado || 'pendiente',
        error: null,
      }]),
    });
    log('🗄️  Registrado en Supabase');
    return true;
  } catch (e) {
    log(`⚠️  No se pudo registrar en Supabase (el video no se ve afectado): ${e.message}`);
    return false;
  }
}

/** Marca el poema del día como publicado y guarda el link */
export async function marcarPublicado(fecha, { tiktok_url, tiktok_post_id, request_id } = {}) {
  if (!activo()) return false;
  try {
    await pedir(`poemas?fecha=eq.${fecha}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        estado: 'publicado',
        tiktok_url: tiktok_url || null,
        tiktok_post_id: tiktok_post_id || null,
        request_id: request_id || null,
      }),
    });
    log(`🗄️  Supabase actualizado: publicado${tiktok_url ? ` · ${tiktok_url}` : ''}`);
    return true;
  } catch (e) {
    log(`⚠️  No se pudo actualizar Supabase: ${e.message}`);
    return false;
  }
}

/** Marca el poema del día como fallido, guardando el motivo */
export async function marcarFallido(fecha, motivo) {
  if (!activo()) return false;
  try {
    await pedir(`poemas?fecha=eq.${fecha}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ estado: 'fallido', error: String(motivo).slice(0, 1000) }),
    });
    return true;
  } catch { return false; }
}

/** Trae los últimos poemas, para reforzar la lógica anti-repetición */
export async function ultimosPoemas(cuantos = 10) {
  if (!activo()) return [];
  try {
    const filas = await pedir(
      `poemas?select=fecha,tema,poema&order=fecha.desc&limit=${cuantos}`);
    return filas || [];
  } catch (e) {
    log(`⚠️  No se pudo leer el historial de Supabase: ${e.message}`);
    return [];
  }
}

/** Permite llenar las métricas a mano o desde otro script */
export async function guardarMetricas(fecha, { vistas, likes, comentarios, compartidos, guardados }) {
  if (!activo()) return false;
  try {
    await pedir(`poemas?fecha=eq.${fecha}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        vistas, likes, comentarios, compartidos, guardados,
        metricas_al: new Date().toISOString(),
      }),
    });
    return true;
  } catch (e) {
    log(`⚠️  No se pudieron guardar las métricas: ${e.message}`);
    return false;
  }
}
