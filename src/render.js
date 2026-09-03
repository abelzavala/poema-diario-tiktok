import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cfg, log, hoy } from './config.js';
import { binario } from './binarios.js';

const run = promisify(execFile);

/**
 * Escapa una RUTA para usarla dentro de un filtro de ffmpeg.
 * ffmpeg lee ':' como separador de opciones y '\' como escape, así que una
 * ruta de Windows (C:\Users\...) rompe el filtro. Se convierte a barras
 * normales y se escapan los dos puntos:  C\:/Users/...
 */
const escRuta = p => String(p).replace(/\\/g, '/').replace(/:/g, '\\:');

/** Escapa TEXTO para el filtro drawtext */
const esc = s => String(s)
  .replace(/\\/g, '\\\\')
  .replace(/:/g, '\\:')
  .replace(/'/g, '’')
  .replace(/%/g, '\\%')
  .replace(/,/g, '\\,')
  .replace(/\[/g, '\\[').replace(/\]/g, '\\]');

async function duracion(archivo) {
  const { stdout } = await run(binario('ffprobe'), [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1', archivo,
  ]);
  return parseFloat(stdout.trim());
}

/**
 * Compone el video del día.
 *
 * DISEÑO: el texto va escrito SOBRE LA HOJA del libro, en tinta sepia, como
 * una entrada de diario. Por eso todo aparece hasta que la página llena el
 * cuadro (T_PAGINA) y se queda hasta el final.
 */
export async function renderizar(poema) {
  const { iso, largo } = hoy();
  const salida = path.join(cfg.rutas.salidas, `poema_${iso}.mp4`);
  fs.mkdirSync(cfg.rutas.salidas, { recursive: true });

  if (!fs.existsSync(cfg.rutas.master))
    throw new Error(`No existe el clip maestro:\n  ${cfg.rutas.master}`);

  const DUR = Math.min(await duracion(cfg.rutas.master), 20);
  const F = escRuta(cfg.rutas.fuente);

  // ── Tiempos ───────────────────────────────────────────────
  const T_PAGINA = Number(process.env.T_PAGINA || 5.4);  // cuándo la hoja llena el cuadro
  const PASO     = 0.45;                                 // retraso entre verso y verso
  const FADE     = 0.8;
  const T_FECHA  = T_PAGINA;
  const T_POEMA  = T_PAGINA + 0.7;

  // ── Tipografía adaptativa ─────────────────────────────────
  const maxLen = Math.max(...poema.versos.map(v => v.length));
  const fs_poema = maxLen <= 30 ? 60 : maxLen <= 38 ? 54 : maxLen <= 46 ? 47 : 42;
  const interlinea = Math.round(fs_poema * 1.58);

  // ── Composición sobre la hoja ─────────────────────────────
  const TINTA   = '0x1F1710';                 // tinta oscura: contrasta con el papel
  const SEPIA   = '0x5A452A';                 // sepia más claro para la fecha
  // Sombra sutil en vez de halo: da relieve sin lavar la letra
  const RELIEVE = 'shadowcolor=0x00000038:shadowx=0:shadowy=2';
  const X_FECHA = 60;                         // margen izquierdo de la fecha
  const y_fecha = Math.round(1920 * 0.325);
  const y_dots  = y_fecha + 54;
  const bloque  = interlinea * poema.versos.length;
  const yInicio = Math.round(1920 * 0.555 - bloque / 2);

  const aparece = t => `alpha='if(lt(t,${t}),0,min(1,(t-${t})/${FADE}))'`;
  // x por defecto: centrado. Pasar un número para alinear a la izquierda.
  const texto = (txt, size, color, y, t, extra = '', x = '(w-tw)/2') =>
    `drawtext=fontfile='${F}':text='${esc(txt)}':fontsize=${size}:fontcolor=${color}` +
    `:${aparece(t)}:x=${x}:y=${y}:${RELIEVE}${extra ? ':' + extra : ''}`;

  const filtros = [
    // Fecha y ornamento van en la hoja IZQUIERDA, alineados a la orilla.
    // Los versos siguen centrados, cruzando el pliegue (variante aprobada).
    texto(largo, 38, SEPIA, y_fecha, T_FECHA, '', X_FECHA),            // fecha
    texto('·  ·  ·', 30, SEPIA, y_dots, T_FECHA + 0.3, '', X_FECHA),   // ornamento
    ...poema.versos.map((v, i) =>
      texto(v, fs_poema, TINTA, yInicio + i * interlinea, T_POEMA + i * PASO)),
  ];

  const vf = filtros.join(',') +
    `,fade=t=out:st=${(DUR - 0.9).toFixed(2)}:d=0.9:color=black,format=yuv420p`;

  // ── Audio ─────────────────────────────────────────────────
  const hayMusica = fs.existsSync(cfg.rutas.musica);
  const args = ['-hide_banner', '-loglevel', 'error', '-y', '-i', cfg.rutas.master];
  if (hayMusica) args.push('-stream_loop', '-1', '-i', cfg.rutas.musica);

  args.push('-filter_complex',
    hayMusica
      ? `[0:v]${vf}[v];[1:a]volume=0.30,afade=t=in:st=0:d=2.5,` +
        `afade=t=out:st=${(DUR - 2.5).toFixed(2)}:d=2.5,atrim=0:${DUR}[a]`
      : `[0:v]${vf}[v]`);

  args.push('-map', '[v]');
  if (hayMusica) args.push('-map', '[a]', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100');

  args.push(
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.0',
    '-r', '30', '-t', String(DUR), '-movflags', '+faststart', salida);

  log(`🎬 Renderizando (${DUR.toFixed(1)}s, letra ${fs_poema}px, música: ${hayMusica ? 'sí' : 'no'})…`);
  await run(binario('ffmpeg'), args, { maxBuffer: 1024 * 1024 * 32 });

  log(`✅ Video listo: ${path.basename(salida)} (${(fs.statSync(salida).size / 1e6).toFixed(2)} MB)`);
  return salida;
}
