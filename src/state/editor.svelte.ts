import type { DisplayConfig, El, ElType, ImageEl, Project } from '../core/types';
import { PRESETS, TINTS, configFromPreset, presetById } from '../core/displays';
import { bounds, createElement, ELEMENT_LABELS, moveBy, newId } from '../core/elements';
import { monoOn, renderElements } from '../core/render';
import { packBits } from '../core/gfx';

const STORAGE_KEY = 'oled-designer:project:v1';

/* ---------------- image helpers ---------------- */

const imgCache = new Map<string, HTMLImageElement>();

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image.'));
    img.src = url;
  });
}

/** Downscale a user image so stored projects stay small. Returns a PNG data URL. */
async function normaliseImage(file: File): Promise<{ url: string; w: number; h: number }> {
  const src = await new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = () => rej(new Error('Could not read that file.'));
    fr.readAsDataURL(file);
  });
  const img = await loadImage(src);
  const max = 512;
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * k));
  const h = Math.max(1, Math.round(img.naturalHeight * k));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d')!.drawImage(img, 0, 0, w, h);
  const url = c.toDataURL('image/png');
  const norm = await loadImage(url);
  return { url, w: norm.naturalWidth, h: norm.naturalHeight };
}

/** Convert an image to 1-bit at w×h. Transparent = off, bright = on. */
function toBits(img: HTMLImageElement, w: number, h: number, threshold: number, invert: boolean, dither: boolean) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const lum = new Float32Array(w * h);
  let hasAlpha = false;
  for (let i = 0; i < w * h; i++) {
    const a = data[i * 4 + 3] / 255;
    if (a < 0.99) hasAlpha = true;
    lum[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) * a;
  }
  const on = new Uint8Array(w * h);
  if (dither) {
    // Floyd–Steinberg
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const old = lum[i];
        const nw = old >= threshold ? 255 : 0;
        on[i] = nw ? 1 : 0;
        const err = old - nw;
        if (x + 1 < w) lum[i + 1] += (err * 7) / 16;
        if (y + 1 < h) {
          if (x > 0) lum[i + w - 1] += (err * 3) / 16;
          lum[i + w] += (err * 5) / 16;
          if (x + 1 < w) lum[i + w + 1] += err / 16;
        }
      }
  } else {
    for (let i = 0; i < w * h; i++) on[i] = lum[i] >= threshold ? 1 : 0;
  }
  if (invert) for (let i = 0; i < on.length; i++) on[i] = on[i] ? 0 : 1;
  return { bits: packBits(on, w, h), hasAlpha, litRatio: on.reduce((a, b) => a + b, 0) / on.length };
}

/* ---------------- editor state ---------------- */

export interface Toast {
  id: number;
  text: string;
}

function starterProject(): Project {
  const d = configFromPreset(PRESETS[0]);
  const t = createElement('text', d, 4, 4, 1);
  Object.assign(t, { name: 'Title', text: 'PXLWRIGHT', size: 1 });
  const big = createElement('text', d, 4, 20, 2);
  Object.assign(big, { name: 'Reading', text: '23.5 C', size: 3 });
  const bat = createElement('battery', d, 104, 3, 1);
  Object.assign(bat, { level: 80 });
  const bar = createElement('progress', d, 4, 52, 1);
  Object.assign(bar, { w: 120, h: 9, value: 65 });
  return { version: 1, display: d, elements: [t, big, bat, bar], assets: {} };
}

class Editor {
  display = $state<DisplayConfig>(configFromPreset(PRESETS[0]));
  elements = $state<El[]>([]);
  assets = $state<Record<string, string>>({});

  selectedId = $state<string | null>(null);
  zoom = $state(6);
  autoFit = $state(true);
  showGrid = $state(true);
  toasts = $state<Toast[]>([]);

  private history: string[] = [];
  private hi = -1;
  private toastId = 0;
  private counters: Partial<Record<ElType, number>> = {};

  /** Pixel buffer for the current design. */
  fb = $derived.by(() => renderElements(this.elements, this.display));

  selected = $derived.by(() => this.elements.find((e) => e.id === this.selectedId) ?? null);

  canUndo = $state(false);
  canRedo = $state(false);

  get project(): Project {
    return { version: 1, display: this.display, elements: this.elements, assets: this.assets };
  }

  /* ---- history ---- */

  private snapshot() {
    return JSON.stringify({ display: this.display, elements: this.elements });
  }

  private syncFlags() {
    this.canUndo = this.hi > 0;
    this.canRedo = this.hi < this.history.length - 1;
  }

  resetHistory() {
    this.history = [this.snapshot()];
    this.hi = 0;
    this.syncFlags();
  }

  commit() {
    const s = this.snapshot();
    if (s === this.history[this.hi]) return;
    this.history = this.history.slice(0, this.hi + 1);
    this.history.push(s);
    if (this.history.length > 100) this.history.shift();
    this.hi = this.history.length - 1;
    this.syncFlags();
  }

  private restore(s: string) {
    const p = JSON.parse(s) as { display: DisplayConfig; elements: El[] };
    this.display = p.display;
    this.elements = p.elements;
    if (this.selectedId && !this.elements.some((e) => e.id === this.selectedId)) this.selectedId = null;
  }

  undo() {
    if (this.hi <= 0) return;
    this.hi--;
    this.restore(this.history[this.hi]);
    this.syncFlags();
  }

  redo() {
    if (this.hi >= this.history.length - 1) return;
    this.hi++;
    this.restore(this.history[this.hi]);
    this.syncFlags();
  }

  /* ---- project load/save ---- */

  load(p: Project) {
    this.display = p.display;
    this.elements = p.elements;
    this.assets = p.assets ?? {};
    this.selectedId = null;
    this.autoFit = true;
    this.counters = {};
    for (const e of this.elements) this.bumpCounter(e);
    this.resetHistory();
  }

  private bumpCounter(e: El) {
    const m = new RegExp(`^${ELEMENT_LABELS[e.type]} (\\d+)$`).exec(e.name);
    if (m) this.counters[e.type] = Math.max(this.counters[e.type] ?? 0, Number(m[1]));
  }

  loadSaved(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const p = JSON.parse(raw) as Project;
      if (p.version !== 1 || !p.display || !Array.isArray(p.elements)) return false;
      // validate preset still exists
      p.display.presetId = presetById(p.display.presetId).id;
      this.load(p);
      return true;
    } catch {
      return false;
    }
  }

  loadStarter() {
    this.load(starterProject());
  }

  persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.project));
    } catch {
      /* storage full or unavailable: designs still work, they just won't auto-restore */
    }
  }

  newProject() {
    this.elements = [];
    this.selectedId = null;
    this.counters = {};
    this.commit();
  }

  exportJson(): string {
    // only ship assets that are still referenced
    const used = new Set(this.elements.filter((e): e is ImageEl => e.type === 'image').map((e) => e.assetId));
    const assets: Record<string, string> = {};
    for (const id of used) if (this.assets[id]) assets[id] = this.assets[id];
    return JSON.stringify({ ...this.project, assets }, null, 2);
  }

  importJson(text: string) {
    const p = JSON.parse(text) as Project;
    if (p.version !== 1 || !p.display || !Array.isArray(p.elements)) throw new Error('This is not a PXLWRIGHT project file.');
    p.display.presetId = presetById(p.display.presetId).id;
    this.load(p);
  }

  /* ---- display ---- */

  setPreset(id: string) {
    const p = presetById(id);
    const prev = this.display;
    if (p.id === 'custom') {
      this.display = { ...prev, presetId: 'custom' };
    } else {
      this.display = { ...configFromPreset(p, prev.tint) };
    }
    this.autoFit = true;
    this.commit();
  }

  setTint(hex: string) {
    this.display.tint = hex;
  }

  /* ---- toasts ---- */

  toast(text: string) {
    const id = ++this.toastId;
    this.toasts.push({ id, text });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 4200);
  }

  /* ---- elements ---- */

  select(id: string | null) {
    this.selectedId = id;
  }

  private nextName(type: ElType) {
    const n = (this.counters[type] ?? 0) + 1;
    this.counters[type] = n;
    return n;
  }

  add(type: Exclude<ElType, 'image'>, x?: number, y?: number): El {
    const n = this.nextName(type);
    const stagger = ((this.elements.length * 6) % 24) | 0;
    const el = createElement(
      type,
      this.display,
      x ?? 4 + stagger,
      y ?? 4 + stagger,
      n
    );
    this.elements.push(el);
    // push returns the length; get the proxied element back
    const live = this.elements[this.elements.length - 1];
    // a dropped element is positioned by its centre for a natural feel
    if (x !== undefined && y !== undefined) {
      const b = bounds(live);
      const dx = Math.round(b.w / 2);
      const dy = Math.round(b.h / 2);
      moveBy(live, -dx, -dy);
    }
    this.selectedId = live.id;
    this.commit();
    return live;
  }

  async addImage(file: File, x?: number, y?: number) {
    try {
      const { url, w, h } = await normaliseImage(file);
      const assetId = 'a' + newId();
      this.assets[assetId] = url;
      const img = await loadImage(url);
      imgCache.set(assetId, img);

      const n = this.nextName('image');
      const el = createElement('image', this.display, x ?? 4, y ?? 4, n) as ImageEl;
      const fit = Math.max(8, Math.floor(Math.min(this.display.width, this.display.height) * 0.6));
      const k = Math.min(1, fit / Math.max(w, h)) || 1;
      el.w = Math.max(1, Math.round(w * k));
      el.h = Math.max(1, Math.round(h * k));
      el.assetId = assetId;
      el.name = file.name.replace(/\.[^.]+$/, '').slice(0, 24) || el.name;

      // Auto-pick polarity: most logos are dark art on a light page; an OLED lights the bright pixels.
      let r = toBits(img, el.w, el.h, el.threshold, false, false);
      if (!r.hasAlpha && r.litRatio > 0.6) {
        el.invert = true;
        r = toBits(img, el.w, el.h, el.threshold, true, false);
      }
      el.bits = r.bits;
      if (x !== undefined && y !== undefined) {
        el.x = Math.round(x - el.w / 2);
        el.y = Math.round(y - el.h / 2);
      }
      this.elements.push(el);
      this.selectedId = el.id;
      this.commit();
    } catch (err) {
      this.toast(err instanceof Error ? err.message : 'Could not add that image.');
    }
  }

  /** Recompute an image element's bits (after resize / threshold / invert / dither change). */
  rebuildImage(el: ImageEl) {
    const apply = (img: HTMLImageElement) => {
      el.bits = toBits(img, Math.max(1, el.w), Math.max(1, el.h), el.threshold, el.invert, el.dither).bits;
    };
    const cached = imgCache.get(el.assetId);
    if (cached) return apply(cached);
    const url = this.assets[el.assetId];
    if (!url) return;
    loadImage(url).then((img) => {
      imgCache.set(el.assetId, img);
      apply(img);
    });
  }

  async replaceImage(el: ImageEl, file: File) {
    try {
      const { url } = await normaliseImage(file);
      const assetId = 'a' + newId();
      this.assets[assetId] = url;
      imgCache.set(assetId, await loadImage(url));
      el.assetId = assetId;
      this.rebuildImage(el);
      this.commit();
    } catch (err) {
      this.toast(err instanceof Error ? err.message : 'Could not read that image.');
    }
  }

  remove(id: string) {
    this.elements = this.elements.filter((e) => e.id !== id);
    if (this.selectedId === id) this.selectedId = null;
    this.commit();
  }

  duplicate(id: string) {
    const src = this.elements.find((e) => e.id === id);
    if (!src) return;
    const copy = JSON.parse(JSON.stringify(src)) as El;
    copy.id = newId();
    copy.name = `${ELEMENT_LABELS[copy.type]} ${this.nextName(copy.type)}`;
    moveBy(copy, 4, 4);
    const i = this.elements.findIndex((e) => e.id === id);
    this.elements.splice(i + 1, 0, copy);
    this.selectedId = copy.id;
    this.commit();
  }

  /** dir > 0 = towards the front (drawn later) */
  reorder(id: string, dir: 1 | -1) {
    const i = this.elements.findIndex((e) => e.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= this.elements.length) return;
    const [el] = this.elements.splice(i, 1);
    this.elements.splice(j, 0, el);
    this.commit();
  }

  nudge(dx: number, dy: number) {
    const e = this.selected;
    if (!e || e.locked) return;
    moveBy(e, dx, dy);
  }

  /** On a mono panel, is this colour lit? */
  isOn(hex: string) {
    return monoOn(hex);
  }

  get tints() {
    return TINTS;
  }
}

export const editor = new Editor();
