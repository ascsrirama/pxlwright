<!-- Top bar: logo, file buttons, undo/redo, zoom, and the "Get code" button. -->
<script lang="ts">
  import { editor } from '../../state/editor.svelte';
  import { newProject, openProjectFile, saveProjectFile } from '../../state/files';
  import Icon from '../common/Icon.svelte';

  let { onexport }: { onexport: () => void } = $props();

  let openInput = $state<HTMLInputElement>();

  function onOpen(ev: Event & { currentTarget: HTMLInputElement }) {
    const f = ev.currentTarget.files?.[0];
    ev.currentTarget.value = '';
    if (f) openProjectFile(f);
  }

  function onZoom(e: Event & { currentTarget: HTMLInputElement }) {
    editor.autoFit = false;
    editor.zoom = Number(e.currentTarget.value);
  }
</script>

<header class="topbar">
  <div class="brand">
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2.5" fill="var(--canvas-handle)" stroke="var(--accent)" stroke-width="1.6" />
      <path d="M6 15h3v-4h3v2h3v-3h3" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linejoin="round" />
    </svg>
    <span>OLED&nbsp;Designer</span>
  </div>

  <div class="tools">
    <button type="button" class="ib" title="New design" onclick={newProject}><Icon name="new" /></button>
    <button type="button" class="ib" title="Open project file…" onclick={() => openInput?.click()}><Icon name="upload" /></button>
    <button type="button" class="ib" title="Save project file" onclick={saveProjectFile}><Icon name="download" /></button>
    <input bind:this={openInput} type="file" accept="application/json,.json" hidden onchange={onOpen} />
    <span class="sep"></span>
    <button type="button" class="ib" title="Undo (Ctrl+Z)" disabled={!editor.canUndo} onclick={() => editor.undo()}><Icon name="undo" /></button>
    <button type="button" class="ib" title="Redo (Ctrl+Shift+Z)" disabled={!editor.canRedo} onclick={() => editor.redo()}><Icon name="redo" /></button>
  </div>

  <div class="zoom">
    <label class="check small"><input type="checkbox" bind:checked={editor.showGrid} /><span>Pixel grid</span></label>
    <input type="range" min="1" max="24" step="1" value={editor.zoom} oninput={onZoom} aria-label="Zoom" />
    <button type="button" class="ib" class:active={editor.autoFit} title="Fit to window" onclick={() => (editor.autoFit = true)}>
      <Icon name="fit" />
    </button>
  </div>

  <span class="grow"></span>
  <button type="button" class="btn primary" onclick={onexport}><Icon name="code" size={15} /> Get code</button>
</header>

<style>
  .topbar {
    height: 100%;
    display: flex; align-items: center; gap: 14px;
    padding: 0 14px;
    background: var(--panel);
    border-bottom: 1px solid var(--line);
  }
  .brand { display: flex; align-items: center; gap: 8px; font-weight: 650; letter-spacing: 0.01em; }
  .tools, .zoom { display: flex; align-items: center; gap: 4px; }
  .zoom { gap: 10px; margin-left: 6px; }
  .zoom input[type='range'] { width: 110px; accent-color: var(--accent); }
  .sep { width: 1px; height: 20px; background: var(--line-2); margin: 0 6px; }
  .btn { margin-top: 0; }
</style>
