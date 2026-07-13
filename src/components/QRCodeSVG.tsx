function generateQRCells(code: string): boolean[][] {
  const size = 25;
  const cells: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = ((hash << 5) - hash + code.charCodeAt(i)) | 0;
  }
  const seed = Math.abs(hash);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = Math.sin(seed * 9301 + x * 49297 + y * 233) * 49297;
      cells[y][x] = v - Math.floor(v) > 0.45;
    }
  }

  const drawFinder = (ox: number, oy: number) => {
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        const on =
          dy === 0 || dy === 6 || dx === 0 || dx === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
        if (oy + dy < size && ox + dx < size) cells[oy + dy][ox + dx] = on;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  return cells;
}

export function buildQRCodeSvgMarkup(code: string, size = 200): string {
  const cells = generateQRCells(code);
  const cellSize = Math.floor(size / cells.length);
  const actualSize = cellSize * cells.length;
  const rects = cells
    .flatMap((row, y) =>
      row.flatMap((filled, x) =>
        filled
          ? [`<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0f172a" />`]
          : []
      )
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${actualSize}" height="${actualSize}" viewBox="0 0 ${actualSize} ${actualSize}">
  ${rects}
</svg>`;
}

export function downloadQRCodeSvg(code: string, filename: string, size = 200) {
  const svg = buildQRCodeSvgMarkup(code, size);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function QRCodeSVG({ code, size = 200 }: { code: string; size?: number }) {
  const cells = generateQRCells(code);
  const cellSize = Math.floor(size / cells.length);
  const actualSize = cellSize * cells.length;

  return (
    <svg width={actualSize} height={actualSize} viewBox={`0 0 ${actualSize} ${actualSize}`} className="mx-auto">
      {cells.map((row, y) =>
        row.map((filled, x) =>
          filled ? <rect key={`${x}-${y}`} x={x * cellSize} y={y * cellSize} width={cellSize} height={cellSize} fill="#0f172a" /> : null
        )
      )}
    </svg>
  );
}
