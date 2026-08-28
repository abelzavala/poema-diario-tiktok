/**
 * Localiza ffmpeg y ffprobe aunque no estén en el PATH.
 *
 * En Windows, winget instala ffmpeg pero el PATH solo se actualiza para
 * terminales NUEVAS, y a veces ni así. Este módulo lo busca en los lugares
 * habituales para que el proyecto funcione sin configuración manual.
 *
 * Si tienes ffmpeg en una ruta rara, defínela en el .env:
 *   FFMPEG_PATH=C:\ruta\a\ffmpeg.exe
 *   FFPROBE_PATH=C:\ruta\a\ffprobe.exe
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const esWindows = process.platform === 'win32';
const exe = n => (esWindows ? `${n}.exe` : n);

/** Carpetas donde suele quedar ffmpeg en cada sistema */
function candidatos(nombre) {
  const rutas = [];
  const home = os.homedir();

  if (esWindows) {
    const local = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    // Alias que crea winget
    rutas.push(path.join(local, 'Microsoft', 'WinGet', 'Links', exe(nombre)));
    // Instalación real de winget: ...\Packages\Gyan.FFmpeg_.../ffmpeg-N-full_build/bin/
    const paquetes = path.join(local, 'Microsoft', 'WinGet', 'Packages');
    try {
      for (const d of fs.readdirSync(paquetes)) {
        if (!/ffmpeg/i.test(d)) continue;
        const base = path.join(paquetes, d);
        rutas.push(path.join(base, 'bin', exe(nombre)));
        try {
          for (const sub of fs.readdirSync(base)) {
            rutas.push(path.join(base, sub, 'bin', exe(nombre)));
          }
        } catch { /* sin subcarpetas */ }
      }
    } catch { /* winget no instalado */ }
    // Chocolatey y instalaciones manuales frecuentes
    rutas.push(
      'C:\\ProgramData\\chocolatey\\bin\\' + exe(nombre),
      'C:\\ffmpeg\\bin\\' + exe(nombre),
      'C:\\Program Files\\ffmpeg\\bin\\' + exe(nombre),
    );
  } else {
    rutas.push(
      `/usr/bin/${nombre}`,
      `/usr/local/bin/${nombre}`,
      `/opt/homebrew/bin/${nombre}`,
      `/snap/bin/${nombre}`,
    );
  }
  return rutas;
}

const cache = new Map();

/** Devuelve la ruta ejecutable de 'ffmpeg' o 'ffprobe' */
export function binario(nombre) {
  if (cache.has(nombre)) return cache.get(nombre);

  // 1) Ruta explícita en el .env
  const manual = process.env[`${nombre.toUpperCase()}_PATH`];
  if (manual && fs.existsSync(manual)) {
    cache.set(nombre, manual);
    return manual;
  }

  // 2) ¿Ya está en el PATH?
  try {
    execFileSync(exe(nombre), ['-version'], { stdio: 'ignore' });
    cache.set(nombre, exe(nombre));
    return exe(nombre);
  } catch { /* no está en el PATH, seguimos buscando */ }

  // 3) Buscar en las ubicaciones habituales
  for (const r of candidatos(nombre)) {
    if (fs.existsSync(r)) {
      cache.set(nombre, r);
      return r;
    }
  }

  throw new Error(
    `No encuentro "${nombre}".\n` +
    (esWindows
      ? '  1) Instálalo:  winget install Gyan.FFmpeg\n' +
        '  2) CIERRA PowerShell y ábrelo de nuevo (el PATH no se actualiza solo)\n' +
        `  3) Si aún falla, agrega esta línea a tu .env:\n` +
        `     ${nombre.toUpperCase()}_PATH=C:\\ruta\\completa\\a\\${exe(nombre)}`
      : '  Instálalo con:  sudo apt install ffmpeg   (o  brew install ffmpeg)')
  );
}
