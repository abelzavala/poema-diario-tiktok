import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Carga .env sin dependencias externas
const envPath = path.join(RAIZ, '.env');
if (fs.existsSync(envPath)) {
  for (const linea of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const l = linea.trim();
    if (!l || l.startsWith('#')) continue;
    const i = l.indexOf('=');
    if (i === -1) continue;
    const k = l.slice(0, i).trim();
    const v = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!(k in process.env)) process.env[k] = v;
  }
}

export const cfg = {
  anthropicKey:   process.env.ANTHROPIC_API_KEY || '',
  uploadPostKey:  process.env.UPLOADPOST_API_KEY || '',
  uploadPostUser: process.env.UPLOADPOST_USER || '',
  geminiKey:      process.env.GEMINI_API_KEY || '',
  elevenKey:      process.env.ELEVENLABS_API_KEY || '',
  supabaseUrl:    process.env.SUPABASE_URL || '',
  supabaseKey:    process.env.SUPABASE_SERVICE_KEY || '',
  zona:           process.env.ZONA_HORARIA || 'America/Mexico_City',
  publicar:       String(process.env.PUBLICAR ?? 'true').toLowerCase() !== 'false',

  rutas: {
    master:     path.join(RAIZ, 'assets', 'libro_master.mp4'),
    referencia: path.join(RAIZ, 'assets', 'libro_referencia.png'),
    fuente:     path.join(RAIZ, 'assets', 'fuentes', 'cormorant.ttf'),
    musica:     path.join(RAIZ, 'assets', 'audio', 'fondo.mp3'),
    salidas:    path.join(RAIZ, 'salidas'),
    historial:  path.join(RAIZ, 'datos', 'historial.json'),
  },
};

export const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

// Fecha de HOY en la zona horaria del usuario
export function hoy() {
  const f = new Intl.DateTimeFormat('sv-SE', { timeZone: cfg.zona }).format(new Date()); // YYYY-MM-DD
  const largo = new Intl.DateTimeFormat('es-MX', {
    timeZone: cfg.zona, day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date());
  return { iso: f, largo: largo.toUpperCase() };
}
