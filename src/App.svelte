<!--
  Page layout: top bar, left sidebar, canvas in the middle, properties on the right.
  Move panels between columns or change column widths here.
-->
<script lang="ts">
  import { useAutosave } from './state/autosave.svelte';
  import { handleShortcut } from './state/shortcuts';
  import TopBar from './ui/topbar/TopBar.svelte';
  import DisplayPicker from './ui/panels/DisplayPicker.svelte';
  import Palette from './ui/panels/Palette.svelte';
  import Layers from './ui/panels/Layers.svelte';
  import Stage from './ui/canvas/Stage.svelte';
  import Inspector from './ui/inspector/Inspector.svelte';
  import ExportDialog from './ui/dialogs/ExportDialog.svelte';
  import Toasts from './ui/common/Toasts.svelte';

  let exporting = $state(false);

  useAutosave();

  function onKeyDown(e: KeyboardEvent) {
    if (!exporting) handleShortcut(e);
  }
</script>

<svelte:window onkeydown={onKeyDown} />

<div class="app">
  <div class="top">
    <TopBar onexport={() => (exporting = true)} />
  </div>

  <aside class="left">
    <DisplayPicker />
    <Palette />
    <Layers />
  </aside>

  <main class="center">
    <Stage />
  </main>

  <div class="right">
    <Inspector />
  </div>

  {#if exporting}
    <ExportDialog onclose={() => (exporting = false)} />
  {/if}

  <Toasts />
</div>

<style>
  .app {
    display: grid;
    height: 100%;
    grid-template-columns: var(--left-w) minmax(0, 1fr) var(--right-w);
    grid-template-rows: var(--topbar-h) minmax(0, 1fr);
    grid-template-areas: 'top top top' 'left center right';
  }
  .top { grid-area: top; min-width: 0; }
  .left { grid-area: left; overflow-y: auto; border-right: 1px solid var(--line); background: var(--panel); }
  .center { grid-area: center; min-width: 0; min-height: 0; display: flex; }
  .right { grid-area: right; overflow-y: auto; border-left: 1px solid var(--line); background: var(--panel); }

  /* narrow screens: properties drop below the canvas */
  @media (max-width: 1000px) {
    .app {
      grid-template-columns: 230px minmax(0, 1fr);
      grid-template-areas: 'top top' 'left center' 'left right';
      grid-template-rows: var(--topbar-h) minmax(0, 1fr) auto;
    }
    .right { border-left: 0; border-top: 1px solid var(--line); max-height: 40vh; }
  }
</style>
