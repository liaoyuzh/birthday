import { MappedPixel } from './pixelation';
import { GridDimensions } from './gridSnapUtils';
import { isPatternCell } from './organizeModeUtils';

export interface DrawBoardOptions {
  showGhost: boolean;
  fusionMap?: number[][] | null;
  showGrid?: boolean;
  paperOpacity?: number;
  highlightColor?: string | null;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawFusedBead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  color: string,
  fusion: number
) {
  const cx = x + cellSize / 2;
  const cy = y + cellSize / 2;
  const f = Math.max(0, Math.min(1, fusion));

  if (f >= 0.96) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, cellSize, cellSize);

    const sheen = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
    sheen.addColorStop(0, 'rgba(255,255,255,0.18)');
    sheen.addColorStop(0.45, 'rgba(255,255,255,0)');
    sheen.addColorStop(1, 'rgba(0,0,0,0.06)');
    ctx.fillStyle = sheen;
    ctx.fillRect(x, y, cellSize, cellSize);
    return;
  }

  const beadR = cellSize * (0.3 + f * 0.2);
  const holeR = cellSize * 0.12 * (1 - f) ** 1.2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, beadR, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  if (holeR > 0.35) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, holeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  const melt = f * 0.85;
  if (melt > 0.05) {
    ctx.beginPath();
    ctx.arc(cx, cy, beadR + cellSize * 0.06 * melt, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.55 * (1 - f * 0.7)})`;
    ctx.lineWidth = Math.max(0.5, cellSize * 0.05 * (1 - f * 0.5));
    ctx.stroke();
  }
  ctx.restore();
}

function drawIroningPaper(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity: number
) {
  if (opacity <= 0) return;

  ctx.save();
  ctx.globalAlpha = opacity * 0.62;
  ctx.fillStyle = '#f8f4ec';
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = opacity * 0.12;
  ctx.strokeStyle = '#d4c9b8';
  ctx.lineWidth = 1;
  for (let y = 0; y < height; y += 5) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let x = 0; x < width; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  ctx.globalAlpha = opacity * 0.08;
  ctx.fillStyle = '#fff';
  ctx.fillRect(width * 0.1, height * 0.05, width * 0.8, height * 0.15);
  ctx.restore();
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  patternGrid: MappedPixel[][],
  placedGrid: (string | null)[][],
  cellSize: number,
  gridDimensions: GridDimensions,
  options: DrawBoardOptions
) {
  const { showGhost, fusionMap = null, showGrid = true, paperOpacity = 0, highlightColor = null } = options;
  const { N, M } = gridDimensions;
  const width = N * cellSize;
  const height = M * cellSize;
  const highlightUpper = highlightColor ? highlightColor.toUpperCase() : null;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, width, height);

  // Main drawing pass: background, ghost preview, placed beads, grid lines
  for (let row = 0; row < M; row++) {
    for (let col = 0; col < N; col++) {
      const x = col * cellSize;
      const y = row * cellSize;
      const pixel = patternGrid[row]?.[col];
      const placedColor = placedGrid[row]?.[col];
      const isExternal = Boolean(pixel?.isExternal);
      const isPattern = isPatternCell(pixel);
      const showPattern = showGhost && isPattern && !fusionMap;
      const fusion = fusionMap?.[row]?.[col] ?? 0;
      const gridAlpha = showGrid ? 0.25 * (1 - fusion * 0.9) : 0;

      ctx.fillStyle = isExternal ? '#e5e7eb' : '#f3f4f6';
      ctx.fillRect(x, y, cellSize, cellSize);

      if (showPattern && !placedColor) {
        ctx.fillStyle = `${pixel!.color}33`;
        ctx.fillRect(x, y, cellSize, cellSize);

        const ghostPad = cellSize * 0.25;
        const ghostR = (cellSize - ghostPad * 2) / 2;
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, ghostR, 0, Math.PI * 2);
        ctx.fillStyle = `${pixel!.color}66`;
        ctx.fill();
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = 'rgba(107, 114, 128, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (placedColor) {
        if (fusionMap) {
          drawFusedBead(ctx, x, y, cellSize, placedColor, fusion);
        } else {
          const pad = cellSize * 0.2;
          const r = (cellSize - pad * 2) / 2;
          const cx = x + cellSize / 2;
          const cy = y + cellSize / 2;

          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = placedColor;
          ctx.fill();

          ctx.globalCompositeOperation = 'destination-out';
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = 'source-over';

          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.75)';
          ctx.lineWidth = Math.max(1, cellSize * 0.04);
          ctx.stroke();
        }
      }

      if (gridAlpha > 0.05) {
        ctx.strokeStyle = `rgba(156, 163, 175, ${gridAlpha})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);
      }
    }
  }

  if (showGrid) {
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 1; i < Math.floor(N / 10); i++) {
      const lx = i * 10 * cellSize + 0.5;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, height);
      ctx.stroke();
    }
    for (let i = 1; i < Math.floor(M / 10); i++) {
      const ly = i * 10 * cellSize + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(width, ly);
      ctx.stroke();
    }
  }

  // Third pass: highlight borders drawn on top of everything
  if (highlightUpper && !fusionMap) {
    for (let row = 0; row < M; row++) {
      for (let col = 0; col < N; col++) {
        const pixel = patternGrid[row]?.[col];
        const placedColor = placedGrid[row]?.[col];
        if (!pixel || pixel.isExternal) continue;

        const pixelColorUpper = pixel.color.toUpperCase();
        const placedColorUpper = placedColor?.toUpperCase() ?? null;
        if (pixelColorUpper !== highlightUpper && placedColorUpper !== highlightUpper) continue;

        const x = col * cellSize;
        const y = row * cellSize;
        if (!placedColor) {
          ctx.save();
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)';
          ctx.lineWidth = 2;
          ctx.shadowColor = 'rgba(59, 130, 246, 0.8)';
          ctx.shadowBlur = 5;
          ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          ctx.restore();
        }
      }
    }
  }

  drawIroningPaper(ctx, width, height, paperOpacity);
}

export function createFusionMap(
  rows: number,
  cols: number,
  ironX: number,
  cellSize: number,
  ironWidth: number,
  placedGrid?: (string | null)[][]
): number[][] {
  const map: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  const trail = ironWidth * 0.6;
  const heat = ironWidth * 0.4;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (placedGrid && !placedGrid[row]?.[col]) continue;

      const cellCenterX = (col + 0.5) * cellSize;
      const distBehind = ironX - cellCenterX;
      if (distBehind < -heat) {
        map[row][col] = 0;
      } else if (distBehind < 0) {
        map[row][col] = Math.max(0, (distBehind + heat) / heat) * 0.4;
      } else if (distBehind < trail) {
        const t = distBehind / trail;
        map[row][col] = 0.4 + t * 0.6;
      } else {
        map[row][col] = 1;
      }
    }
  }
  return map;
}

export function createFullFusionMap(
  rows: number,
  cols: number,
  placedGrid?: (string | null)[][]
): number[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) =>
      placedGrid && !placedGrid[row]?.[col] ? 0 : 1
    )
  );
}

interface SteamParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export type { SteamParticle };

export function drawIronEffects(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  ironX: number,
  ironY: number,
  ironW: number,
  ironH: number,
  time: number,
  particles: SteamParticle[]
) {
  const heatLeft = ironX - ironW * 0.2;
  const heatRight = ironX + ironW * 0.5;

  ctx.save();
  const glowGrad = ctx.createRadialGradient(
    ironX + ironW * 0.1,
    ironY + ironH * 0.6,
    0,
    ironX + ironW * 0.1,
    ironY + ironH * 0.6,
    ironW * 0.9
  );
  glowGrad.addColorStop(0, 'rgba(255, 120, 40, 0.25)');
  glowGrad.addColorStop(0.5, 'rgba(255, 80, 20, 0.1)');
  glowGrad.addColorStop(1, 'rgba(255, 120, 40, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(heatLeft - ironW * 0.3, ironY - ironH, ironW * 2, ironH * 3);

  const shimmerGrad = ctx.createLinearGradient(heatLeft, 0, heatRight, 0);
  shimmerGrad.addColorStop(0, 'rgba(255, 180, 80, 0)');
  shimmerGrad.addColorStop(0.35, 'rgba(255, 140, 60, 0.14)');
  shimmerGrad.addColorStop(0.65, 'rgba(255, 100, 40, 0.2)');
  shimmerGrad.addColorStop(1, 'rgba(255, 180, 80, 0)');
  ctx.fillStyle = shimmerGrad;
  ctx.fillRect(heatLeft, 0, heatRight - heatLeft, height);

  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = 'rgba(255, 200, 120, 0.6)';
  ctx.lineWidth = 1;
  for (let y = 0; y < height; y += 8) {
    const wave = Math.sin(time * 0.012 + y * 0.08) * 3;
    ctx.beginPath();
    ctx.moveTo(heatLeft, y);
    ctx.lineTo(heatRight + wave, y);
    ctx.stroke();
  }
  ctx.restore();

  for (const p of particles) {
    const alpha = (p.life / p.maxLife) * 0.45;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(240, 240, 245, 0.9)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const bodyX = ironX - ironW * 0.35;
  const bodyY = ironY - ironH * 0.15;

  ctx.save();
  roundRect(ctx, bodyX, bodyY, ironW, ironH, 6);
  const bodyGrad = ctx.createLinearGradient(bodyX, bodyY, bodyX, bodyY + ironH);
  bodyGrad.addColorStop(0, '#4a4a4a');
  bodyGrad.addColorStop(0.55, '#3a3a3a');
  bodyGrad.addColorStop(0.75, '#c45c2a');
  bodyGrad.addColorStop(1, '#e87830');
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const handleW = ironW * 0.35;
  const handleH = ironH * 0.35;
  roundRect(
    ctx,
    bodyX + ironW * 0.32,
    bodyY - handleH * 0.85,
    handleW,
    handleH,
    4
  );
  ctx.fillStyle = '#2d2d2d';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.stroke();

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = 'rgba(255, 220, 150, 0.6)';
  ctx.fillRect(bodyX, bodyY + ironH * 0.7, ironW, ironH * 0.3);
  ctx.restore();
}

export function updateSteamParticles(
  particles: SteamParticle[],
  ironX: number,
  ironY: number,
  ironW: number,
  ironH: number,
  dt: number
): SteamParticle[] {
  const next = particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx * dt * 0.06,
      y: p.y + p.vy * dt * 0.06,
      life: p.life - dt,
      size: p.size + dt * 0.008,
    }))
    .filter((p) => p.life > 0);

  if (Math.random() < 0.45) {
    next.push({
      x: ironX + (Math.random() - 0.3) * ironW * 0.5,
      y: ironY + ironH * 0.5 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -0.8 - Math.random() * 1.2,
      life: 400 + Math.random() * 500,
      maxLife: 900,
      size: 2 + Math.random() * 4,
    });
  }

  return next.slice(-40);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}
