<!--
  The design canvas: mouse move / resize, dropping from the palette or image files, auto-fit zoom.
  Painting is in drawStage.ts, hit-testing in hitTest.ts, colours in theme.css (--canvas-*).
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { editor } from '../../state/editor.svelte';
  import { bounds, resizeMode, setBox, type Rect } from '../../core/elements';
  import type { El, ElType, ImageEl } from '../../core/types';
  import { CURSORS, MARGIN as M, hitElement, hitHandle, type HandleId } from './hitTest';
  import { drawStage } from './drawStage';
  import { readCanvasColors } from './canvasColors';
  import StatusBar from './StatusBar.svelte';

  let wrap = $state<HTMLDivElement>();
  let canvas = $state<HTMLCanvasElement>();
  let hoverId = $state<string | null>(null);
  let cursorPos = $state<{ x: number; y: number } | null>(null);
  let dropping = $state(false);

  /* ---------------- auto-fit ---------------- */

  function fit() {
    if (!wrap || !editor.autoFit) return;
    const d = editor.display;
    const aw = wrap.clientWidth - 2 * M - 8;
    const ah = wrap.clientHeight - 2 * M - 8;
    if (aw <= 0 || ah <= 0) return;
    editor.zoom = Math.max(1, Math.min(32, Math.floor(Math.min(aw / d.width, ah / d.height))));
  }

  onMount(() => {
    const ro = new ResizeObserver(fit);
    if (wrap) ro.observe(wrap);
    return () => ro.disconnect();
  });

  $effect(() => {
    // refit when the display changes or auto-fit is switched back on
    void editor.display.width;
    void editor.display.height;
    void editor.autoFit;
    fit();
  });

  /* ---------------- drawing ---------------- */

  $effect(() => {
    // Track everything drawStage() reads.
    void editor.elements.length;
    void editor.fb;
    void editor.display.shape;
    void editor.selectedId;
    const sel = editor.selected;
    if (sel) {
      bounds(sel);
      void sel.locked;
      void sel.visible;
    }
    void hoverId;
    void editor.zoom;
    void editor.showGrid;
    if (!canvas) return;
    const hovered = hoverId && hoverId !== editor.selectedId ? (editor.elements.find((e) => e.id === hoverId) ?? null) : null;
    drawStage(canvas, {
      display: editor.display,
      fb: editor.fb,
      zoom: editor.zoom,
      showGrid: editor.showGrid,
      hovered,
      selected: sel,
      colors: readCanvasColors(canvas)
    });
  });

  /* ---------------- interaction ---------------- */

  function toLogical(ev: { clientX: number; clientY: number }) {
    const r = canvas!.getBoundingClientRect();
    const z = editor.zoom;
    return { x: (ev.clientX - r.left - M) / z, y: (ev.clientY - r.top - M) / z };
  }

  type Drag =
    | { kind: 'move'; el: El; sx: number; sy: number; ox: number; oy: number; ox2: number; oy2: number; moved: boolean }
    | { kind: 'resize'; el: El; handle: HandleId; sx: number; sy: number; orig: Rect }
    | null;
  let drag: Drag = null;

  function onPointerDown(ev: PointerEvent) {
    if (ev.button !== 0) return;
    const p = toLogical(ev);
    const sel = editor.selected;
    const h = hitHandle(sel, p.x, p.y, editor.zoom);
    if (h && sel) {
      drag = { kind: 'resize', el: sel, handle: h, sx: p.x, sy: p.y, orig: bounds(sel) };
      canvas!.setPointerCapture(ev.pointerId);
      return;
    }
    const hit = hitElement(editor.elements, p.x, p.y, editor.zoom);
    if (hit) {
      editor.select(hit.id);
      drag = {
        kind: 'move',
        el: hit,
        sx: p.x,
        sy: p.y,
        ox: hit.x,
        oy: hit.y,
        ox2: hit.type === 'line' ? hit.x2 : 0,
        oy2: hit.type === 'line' ? hit.y2 : 0,
        moved: false
      };
      canvas!.setPointerCapture(ev.pointerId);
    } else {
      editor.select(null);
      drag = null;
    }
  }

  function applyResize(d: NonNullable<Drag> & { kind: 'resize' }, p: { x: number; y: number }) {
    const e = d.el;
    const dx = Math.round(p.x - d.sx);
    const dy = Math.round(p.y - d.sy);
    const o = d.orig;

    if (e.type === 'line') {
      const lx = Math.round(p.x - 0.5);
      const ly = Math.round(p.y - 0.5);
      if (d.handle === 'p1') {
        e.x = lx;
        e.y = ly;
      } else {
        e.x2 = lx;
        e.y2 = ly;
      }
      return;
    }

    const mode = resizeMode(e);
    const hasW = d.handle.includes('w');
    const hasE = d.handle.includes('e');
    const hasN = d.handle.includes('n');
    const hasS = d.handle.includes('s');

    if (mode === 'square' && (e.type === 'circle' || e.type === 'gauge')) {
      // grow from the dragged corner, keeping the opposite corner anchored
      const grow = hasE ? dx : -dx;
      const size = Math.max(3, o.w + grow);
      const r = Math.max(1, Math.floor((size - 1) / 2));
      const actual = 2 * r + 1;
      e.r = r;
      e.x = hasW ? o.x + o.w - actual : o.x;
      e.y = hasN ? o.y + o.h - actual : o.y;
      return;
    }

    let x = o.x;
    let y = o.y;
    let w = o.w;
    let h = o.h;
    if (hasE) w = o.w + dx;
    if (hasW) {
      w = o.w - dx;
      x = o.x + dx;
    }
    if (hasS) h = o.h + dy;
    if (hasN) {
      h = o.h - dy;
      y = o.y + dy;
    }
    if (w < 1) {
      if (hasW) x = o.x + o.w - 1;
      w = 1;
    }
    if (h < 1) {
      if (hasN) y = o.y + o.h - 1;
      h = 1;
    }
    setBox(e, { x, y, w, h });
    if (e.type === 'image') editor.rebuildImage(e as ImageEl);
  }

  function onPointerMove(ev: PointerEvent) {
    const p = toLogical(ev);
    cursorPos = { x: Math.floor(p.x), y: Math.floor(p.y) };

    if (drag?.kind === 'move') {
      const dx = Math.round(p.x - drag.sx);
      const dy = Math.round(p.y - drag.sy);
      if (!drag.moved && dx === 0 && dy === 0) return;
      drag.moved = true;
      const e = drag.el;
      e.x = drag.ox + dx;
      e.y = drag.oy + dy;
      if (e.type === 'line') {
        e.x2 = drag.ox2 + dx;
        e.y2 = drag.oy2 + dy;
      }
      return;
    }
    if (drag?.kind === 'resize') {
      applyResize(drag, p);
      return;
    }

    // hover feedback
    const h = hitHandle(editor.selected, p.x, p.y, editor.zoom);
    if (h) {
      canvas!.style.cursor = CURSORS[h];
      hoverId = null;
      return;
    }
    const hit = hitElement(editor.elements, p.x, p.y, editor.zoom);
    hoverId = hit?.id ?? null;
    canvas!.style.cursor = hit ? 'move' : 'default';
  }

  function onPointerUp(ev: PointerEvent) {
    if (!drag) return;
    const was = drag;
    drag = null;
    if (canvas?.hasPointerCapture(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId);
    if (was.kind === 'resize' || was.moved) editor.commit();
  }

  function onPointerLeave() {
    if (!drag) {
      hoverId = null;
      cursorPos = null;
    }
  }

  /* ---------------- drop from palette / files ---------------- */

  function onDragOver(ev: DragEvent) {
    const types = ev.dataTransfer?.types ?? [];
    if (types.includes('application/x-oled-type') || types.includes('Files')) {
      ev.preventDefault();
      dropping = true;
    }
  }

  function onDrop(ev: DragEvent) {
    dropping = false;
    if (!canvas) return;
    const p = toLogical(ev);
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    const type = ev.dataTransfer?.getData('application/x-oled-type') as ElType | '';
    if (type) {
      ev.preventDefault();
      if (type !== 'image') editor.add(type, x, y);
      return;
    }
    const file = [...(ev.dataTransfer?.files ?? [])].find((f) => f.type.startsWith('image/'));
    if (file) {
      ev.preventDefault();
      editor.addImage(file, x, y);
    }
  }
</script>

<div class="stage-wrap" bind:this={wrap}>
  <div
    class="stage-scroll"
    class:dropping
    role="application"
    aria-label="Design canvas"
    ondragover={onDragOver}
    ondragleave={() => (dropping = false)}
    ondrop={onDrop}
  >
    <canvas
      bind:this={canvas}
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointercancel={onPointerUp}
      onpointerleave={onPointerLeave}
    ></canvas>
  </div>
  <StatusBar cursor={cursorPos} />
</div>

<style>
  .stage-wrap {
    flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column;
    background: radial-gradient(circle at 50% 40%, var(--stage-glow) 0%, var(--bg) 70%);
  }
  .stage-scroll { flex: 1; min-height: 0; overflow: auto; display: grid; place-items: center; transition: box-shadow 0.12s; }
  .stage-scroll.dropping { box-shadow: inset 0 0 0 2px var(--accent); }
  canvas { display: block; touch-action: none; }
</style>
