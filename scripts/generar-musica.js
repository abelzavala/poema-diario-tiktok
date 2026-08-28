/**
 * Genera la música de fondo con ElevenLabs Music (uso comercial permitido en
 * planes de pago — revisa https://elevenlabs.io/music-terms antes de publicar).
 * Se corre UNA SOLA VEZ:   ELEVENLABS_API_KEY=... npm run musica
 *
 * Si prefieres no usar IA, simplemente coloca tu propio mp3 libre de derechos en:
 *   assets/audio/fondo.mp3
 */
import fs from 'node:fs';
import path from 'node:path';
import { cfg, log } from '../src/config.js';

const PROMPT = `Soft cinematic ambient piano with warm strings pad, very slow and gentle,
contemplative and hopeful, no drums, no vocals, no percussion, minimal and spacious,
like the score of a quiet reflective moment. Loopable.`;

if (!cfg.elevenKey) {
  console.error('❌ Falta ELEVENLABS_API_KEY.');
  console.error('   Alternativa sin IA: pon tu propio mp3 en assets/audio/fondo.mp3');
  process.exit(1);
}

log('🎵 Generando música…');
const r = await fetch('https://api.elevenlabs.io/v1/music', {
  method: 'POST',
  headers: { 'xi-api-key': cfg.elevenKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: PROMPT, music_length_ms: 30000 }),
});

if (!r.ok) {
  console.error(`❌ ElevenLabs respondió ${r.status}: ${(await r.text()).slice(0, 500)}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(cfg.rutas.musica), { recursive: true });
fs.writeFileSync(cfg.rutas.musica, Buffer.from(await r.arrayBuffer()));
log(`✅ Música guardada en assets/audio/fondo.mp3 (${(fs.statSync(cfg.rutas.musica).size / 1e6).toFixed(1)} MB)`);
log('   Vuelve a correr "npm run prueba" para escucharla en el video.');
