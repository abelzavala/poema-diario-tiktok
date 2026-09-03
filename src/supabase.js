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
 * Guarda el poema como una fila NUEVA.
 *
 * DISEÑO: cada generación queda registrada por separado, aunque sea del mismo
 * día. Antes se fusionaba por fecha y una segunda corrida borraba el poema de
 * la primera — se perdia trabajo sin aviso.
 *
 * @returns el id de la fila creada, o null si no se pudo registrar
 */
export async function registrarPoema({ fecha, hora, poema, tema, versos, modelo, caption, hashtags, estado }) {
  if (!activo()) return null;
  try {
    const filas = await pedir('poemas?select=id', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([{
        fecha, hora, poema, tema, versos, modelo, caption, hashtags,
        estado: estado || 'pendiente',
        error: null,
      }]),
    });
    const id = filas?.[0]?.id ?? null;
    log(`🗄️  Registrado en Supabase${id ? ` (fila ${id})` : ''}`);
    return id;
  } catch (e) {
    log(`⚠️  No se pudo registrar en Supabase (el video no se ve afectado): ${e.message}`);
    return null;
  }
}

/**
 * Marca una fila como publicada y guarda el link.
 * Se identifica por id, NO por fecha: puede haber varias filas el mismo dia.
 */
export async function marcarPublicado(id, { tiktok_url, tiktok_post_id, request_id } = {}) {
  if (!activo() || !id) return false;
  try {
    await pedir(`poemas?id=eq.${id}`, {
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

/** Marca una fila como fallida, guardando el motivo. Se identifica por id. */
export async function marcarFallido(id, motivo) {
  if (!activo() || !id) return false;
  try {
    await pedir(`poemas?id=eq.${id}`, {
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
      `poemas?select=fecha,hora,tema,poema&order=creado_en.desc&limit=${cuantos}`);
    return filas || [];
  } catch (e) {
    log(`⚠️  No se pudo leer el historial de Supabase: ${e.message}`);
    return [];
  }
}

/** Permite llenar las métricas a mano o desde otro script */
export async function guardarMetricas(id, { vistas, likes, comentarios, compartidos, guardados }) {
  if (!activo() || !id) return false;
  try {
    await pedir(`poemas?id=eq.${id}`, {
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
