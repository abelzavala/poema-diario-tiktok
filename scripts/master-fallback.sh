#!/usr/bin/env bash
# Genera un clip maestro CINEMATOGRÁFICO a partir de la imagen de referencia,
# sin usar ninguna API de IA. Movimiento: push-in lento hacia la página + vignette.
# Uso: bash scripts/master-fallback.sh
set -euo pipefail
cd "$(dirname "$0")/.."

IN=${IN:-assets/libro_referencia.png}
OUT=${OUT:-assets/libro_master.mp4}
DUR=${DUR:-12}
FPS=30
FRAMES=$((DUR * FPS))
FADEOUT=$(awk "BEGIN{print $DUR-1.0}")

ffmpeg -hide_banner -loglevel error -y -i "$IN" \
  -filter_complex "\
    [0:v]scale=-1:2560,crop=1440:2560:(iw-1440)/2:(ih-2560)/2,setsar=1[big];\
    [big]zoompan=z='min(1.0+0.00075*on,1.28)':\
        x='iw/2-(iw/zoom/2)':\
        y='ih/2-(ih/zoom/2)+(on/${FRAMES})*ih*0.035':\
        d=${FRAMES}:s=1080x1920:fps=${FPS}[zm];\
    [zm]vignette=angle=PI/4.2,\
        eq=contrast=1.06:brightness=-0.015:saturation=1.05,\
        fade=t=in:st=0:d=1.2:color=black,\
        fade=t=out:st=${FADEOUT}:d=1.0:color=black,\
        format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf 18 -r $FPS -t "$DUR" "$OUT"

echo "✅ Clip maestro creado: $OUT"
ffprobe -v error -show_entries stream=width,height,duration -of default=nw=1 "$OUT"
