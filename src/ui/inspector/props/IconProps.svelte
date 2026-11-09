<script lang="ts">
  import { editor } from '../../../state/editor.svelte';
  import { ICONS } from '../../../core/icons';
  import type { IconEl } from '../../../core/types';
  import Num from '../../common/Num.svelte';
  import OpaqueBg from './OpaqueBg.svelte';

  let { el }: { el: IconEl } = $props();

  // icon thumbnails as data URLs (16x16, light pixels on transparent)
  const THUMB_COLOR = '#e6edf3';
  const thumbs: Record<string, string> = {};
  function thumb(id: string): string {
    if (thumbs[id]) return thumbs[id];
    const ic = ICONS.find((i) => i.id === id)!;
    const c = document.createElement('canvas');
    c.width = ic.w;
    c.height = ic.h;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = THUMB_COLOR;
    const bw = (ic.w + 7) >> 3;
    for (let y = 0; y < ic.h; y++)
      for (let x = 0; x < ic.w; x++) if (ic.bits[y * bw + (x >> 3)] & (0x80 >> (x & 7))) ctx.fillRect(x, y, 1, 1);
    return (thumbs[id] = c.toDataURL());
  }
</script>

<div class="icon-grid" role="group" aria-label="Icon">
  {#each ICONS as ic}
    <button
      type="button"
      class="icon-btn"
      class:active={el.iconId === ic.id}
      title={ic.label}
      onclick={() => {
        el.iconId = ic.id;
        editor.commit();
      }}
    >
      <img src={thumb(ic.id)} alt={ic.label} width="16" height="16" />
    </button>
  {/each}
</div>
<Num label="Scale" bind:value={el.scale} min={1} max={6} suffix="×" />
<OpaqueBg {el} />

<style>
  .icon-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 10px; }
  .icon-btn { aspect-ratio: 1; display: grid; place-items: center; background: var(--bg); border: 1px solid var(--line-2); border-radius: 6px; cursor: pointer; padding: 0; }
  .icon-btn img { image-rendering: pixelated; width: 20px; height: 20px; }
  .icon-btn.active { border-color: var(--accent); background: var(--accent-soft); }
</style>
