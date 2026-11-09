/**
 * Colours for the design canvas. The canvas is drawn with JavaScript, so it can't use CSS directly;
 * instead these are read from the --canvas-* variables in src/styles/theme.css.
 */
export interface CanvasColors {
  screen: string;
  ghost: string;
  grid: string;
  outline: string;
  hover: string;
  select: string;
  locked: string;
  handle: string;
}

const FALLBACK: CanvasColors = {
  screen: '#000000',
  ghost: '#14181d',
  grid: 'rgba(0,0,0,0.5)',
  outline: '#3a4350',
  hover: 'rgba(80,200,255,0.55)',
  select: '#4cc9ff',
  locked: '#888888',
  handle: '#0b0d10'
};

export function readCanvasColors(el: Element): CanvasColors {
  const cs = getComputedStyle(el);
  const out = { ...FALLBACK };
  for (const key of Object.keys(FALLBACK) as (keyof CanvasColors)[]) {
    const v = cs.getPropertyValue(`--canvas-${key}`).trim();
    if (v) out[key] = v;
  }
  return out;
}
