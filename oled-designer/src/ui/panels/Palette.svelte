<!-- Left sidebar: the palette of things you can add (drag or click). Tile icons are in `glyph` below. -->
<script lang="ts">
  import { editor } from '../../state/editor.svelte';
  import { ELEMENT_LABELS } from '../../core/elements';
  import type { ElType } from '../../core/types';

  const groups: { label: string; items: ElType[] }[] = [
    { label: 'Basics', items: ['text', 'rect', 'circle', 'line', 'image', 'icon'] },
    { label: 'Widgets', items: ['progress', 'battery', 'signal', 'toggle', 'menu', 'gauge'] }
  ];

  // little glyphs, 24×24
  const glyph: Record<ElType, string> = {
    text: 'M5 6h14 M12 6v13 M9 19h6',
    rect: 'M4 6h16v12H4z',
    circle: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z',
    line: 'M5 19 19 5',
    image: 'M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4',
    icon: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z',
    progress: 'M3 9h18v6H3z M5 11h8v2H5z',
    battery: 'M3 8h15v8H3z M18 11h3v2h-3z M5 10h8v4H5z',
    signal: 'M5 18v-3 M10 18v-6 M15 18v-9 M20 18V6',
    toggle: 'M3 8h18v8H3z M15 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z',
    menu: 'M4 7h16 M4 12h16 M4 17h16',
    gauge: 'M5 18a8 8 0 1 1 14 0 M12 14l4-5'
  };

  let fileInput = $state<HTMLInputElement>();

  function onTileClick(t: ElType) {
    if (t === 'image') fileInput?.click();
    else editor.add(t);
  }

  function onDragStart(ev: DragEvent, t: ElType) {
    ev.dataTransfer?.setData('application/x-oled-type', t);
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'copy';
  }

  function onFile(ev: Event & { currentTarget: HTMLInputElement }) {
    const f = ev.currentTarget.files?.[0];
    if (f) editor.addImage(f);
    ev.currentTarget.value = '';
  }
</script>

<section class="panel">
  <h3>Add</h3>
  <p class="hint">Drag onto the screen, or click to drop in.</p>
  {#each groups as g}
    <div class="group-label">{g.label}</div>
    <div class="tiles">
      {#each g.items as t}
        <button
          type="button"
          class="tile"
          draggable={t !== 'image'}
          ondragstart={(e) => onDragStart(e, t)}
          onclick={() => onTileClick(t)}
          title={t === 'image' ? 'Choose an image file (or drop one on the screen)' : `Add ${ELEMENT_LABELS[t].toLowerCase()}`}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d={glyph[t]} />
          </svg>
          <span>{ELEMENT_LABELS[t]}</span>
        </button>
      {/each}
    </div>
  {/each}
  <input bind:this={fileInput} type="file" accept="image/*" hidden onchange={onFile} />
</section>

<style>
  .group-label { margin: 12px 0 6px; font-size: 11.5px; color: var(--dim); }
  .tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .tile {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    background: var(--panel-2); border: 1px solid var(--line); border-radius: var(--radius); padding: 9px 2px 7px;
    cursor: grab; color: var(--text); font-size: 11px; text-align: center; line-height: 1.15;
  }
  .tile svg { color: var(--accent); }
  .tile:hover { border-color: var(--accent); background: var(--panel-hover); }
  .tile:active { cursor: grabbing; }
</style>
