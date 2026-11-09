/** Paints the design canvas: the panel, its pixels, the grid, and selection / hover outlines. */
import { bounds, type Rect } from '../../core/elements';
import { toImageData } from '../../core/render';
import type { DisplayConfig, El } from '../../core/types';
import type { CanvasColors } from './canvasColors';
import { HANDLE, MARGIN as M, handlesFor } from './hitTest';

export interface StageView {
  display: DisplayConfig;
  fb: Parameters<typeof toImageData>[0];
  zoom: number;
  showGrid: boolean;
  hovered: El | null;
  selected: El | null;
  colors: CanvasColors;
}

/** Scratch canvas the 1:1 pixels are drawn into before being scaled up. */
const buf = typeof document !== 'undefined' ? document.createElement('canvas') : null;

export function drawStage(canvas: HTMLCanvasElement, v: StageView) {
  if (!buf) return;
  const d = v.display;
  const z = v.zoom;
  const c = v.colors;
  const dpr = window.devicePixelRatio || 1;
  const cw = d.width * z + 2 * M;
  const ch = d.height * z + 2 * M;
  canvas.width = Math.round(cw * dpr);
  canvas.height = Math.round(ch * dpr);
  canvas.style.width = cw + 'px';
  canvas.style.height = ch + 'px';
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);

  const px0 = M;
  const py0 = M;
  const pw = d.width * z;
  const ph = d.height * z;
  const round = d.shape === 'round';

  // backdrop (the ghost area outside a round panel is slightly lighter)
  ctx.fillStyle = round ? c.ghost : c.screen;
  ctx.fillRect(px0, py0, pw, ph);
  if (round) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(px0 + pw / 2, py0 + ph / 2, Math.min(pw, ph) / 2, 0, Math.PI * 2);
    ctx.fillStyle = c.screen;
    ctx.fill();
    ctx.restore();
  }

  // pixels
  buf.width = d.width;
  buf.height = d.height;
  buf.getContext('2d')!.putImageData(toImageData(v.fb, d), 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buf, px0, py0, pw, ph);

  // pixel grid
  if (v.showGrid && z >= 6) {
    ctx.strokeStyle = c.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < d.width; x++) {
      ctx.moveTo(px0 + x * z + 0.5, py0);
      ctx.lineTo(px0 + x * z + 0.5, py0 + ph);
    }
    for (let y = 1; y < d.height; y++) {
      ctx.moveTo(px0, py0 + y * z + 0.5);
      ctx.lineTo(px0 + pw, py0 + y * z + 0.5);
    }
    ctx.stroke();
  }

  // panel outline
  ctx.strokeStyle = c.outline;
  ctx.lineWidth = 1.5;
  if (round) {
    ctx.beginPath();
    ctx.arc(px0 + pw / 2, py0 + ph / 2, Math.min(pw, ph) / 2, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeRect(px0 - 0.75, py0 - 0.75, pw + 1.5, ph + 1.5);
  }

  // hover outline
  if (v.hovered && v.hovered.visible) outline(ctx, bounds(v.hovered), c.hover, z, [3, 3]);

  // selection box and resize handles
  const sel = v.selected;
  if (sel && sel.visible) {
    outline(ctx, bounds(sel), sel.locked ? c.locked : c.select, z, sel.locked ? [4, 3] : []);
    if (!sel.locked) {
      ctx.fillStyle = c.handle;
      ctx.strokeStyle = c.select;
      ctx.lineWidth = 1.5;
      for (const h of handlesFor(sel)) {
        const sx = px0 + h.x * z;
        const sy = py0 + h.y * z;
        ctx.beginPath();
        ctx.rect(sx - HANDLE, sy - HANDLE, HANDLE * 2, HANDLE * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }
}

function outline(ctx: CanvasRenderingContext2D, b: Rect, color: string, z: number, dash: number[]) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash(dash);
  ctx.strokeRect(M + b.x * z - 1, M + b.y * z - 1, b.w * z + 2, b.h * z + 2);
  ctx.restore();
}
