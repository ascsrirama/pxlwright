<!-- Strip under the canvas: display size, zoom, and the cursor position. -->
<script lang="ts">
  import { editor } from '../../state/editor.svelte';
  import { insideDisplay } from '../../core/displays';

  let { cursor }: { cursor: { x: number; y: number } | null } = $props();
</script>

<div class="statusbar">
  <span>{editor.display.width}×{editor.display.height}px{editor.display.shape === 'round' ? ' · round' : ''}</span>
  <span>zoom {editor.zoom}×</span>
  <span class="grow"></span>
  {#if cursor}
    <span class:out={!insideDisplay(editor.display, cursor.x, cursor.y)}>x {cursor.x}, y {cursor.y}</span>
  {/if}
</div>

<style>
  .statusbar {
    display: flex; gap: 16px; padding: 6px 14px;
    border-top: 1px solid var(--line); background: var(--panel);
    color: var(--dim); font-family: var(--mono); font-size: 11.5px;
  }
  .out { color: var(--warn); }
</style>
