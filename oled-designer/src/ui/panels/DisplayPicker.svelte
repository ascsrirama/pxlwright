<!-- Left sidebar: choose the display (part number, size, shape, preview colour). -->
<script lang="ts">
  import { editor } from '../../state/editor.svelte';
  import { PRESETS, TINTS, presetById } from '../../core/displays';
  import Num from '../common/Num.svelte';

  const groups = [
    { label: 'Monochrome OLED', items: PRESETS.filter((p) => p.color === 'mono' && p.id !== 'custom') },
    { label: 'Colour, rectangular', items: PRESETS.filter((p) => p.color === 'rgb' && p.shape === 'rect') },
    { label: 'Round', items: PRESETS.filter((p) => p.shape === 'round') },
    { label: 'Other', items: PRESETS.filter((p) => p.id === 'custom') }
  ];

  const preset = $derived(presetById(editor.display.presetId));
  const isCustom = $derived(editor.display.presetId === 'custom');
</script>

<section class="panel">
  <h3>Display</h3>
  <label class="field">
    <span>Part number</span>
    <select value={editor.display.presetId} onchange={(e) => editor.setPreset(e.currentTarget.value)}>
      {#each groups as g}
        <optgroup label={g.label}>
          {#each g.items as p}
            <option value={p.id}>{p.name}</option>
          {/each}
        </optgroup>
      {/each}
    </select>
  </label>

  <div class="chips">
    <span class="chip">{editor.display.width} × {editor.display.height} px</span>
    <span class="chip">{editor.display.shape === 'round' ? 'Round' : 'Rectangular'}</span>
    <span class="chip">{editor.display.color === 'mono' ? 'Mono' : 'RGB565'}</span>
  </div>
  {#if preset.note}<p class="hint">{preset.note}</p>{/if}

  {#if isCustom}
    <div class="grid2" onchange={() => editor.commit()} role="presentation">
      <Num label="Width" bind:value={editor.display.width} min={8} max={512} suffix="px" />
      <Num label="Height" bind:value={editor.display.height} min={8} max={512} suffix="px" />
    </div>
    <label class="field">
      <span>Shape</span>
      <select bind:value={editor.display.shape} onchange={() => editor.commit()}>
        <option value="rect">Rectangular</option>
        <option value="round">Round</option>
      </select>
    </label>
    <label class="field">
      <span>Colour</span>
      <select bind:value={editor.display.color} onchange={() => editor.commit()}>
        <option value="mono">Monochrome</option>
        <option value="rgb">Colour (RGB565)</option>
      </select>
    </label>
  {/if}

  {#if editor.display.color === 'mono'}
    <div class="field">
      <span>Preview colour</span>
      <div class="colors">
        {#each TINTS as t}
          <button
            type="button"
            class="sw"
            class:active={editor.display.tint === t.hex}
            style:background={t.hex}
            title={t.name}
            aria-label={t.name}
            onclick={() => editor.setTint(t.hex)}
          ></button>
        {/each}
      </div>
    </div>
  {/if}
</section>

<style>
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  .chip { background: var(--panel-2); border: 1px solid var(--line); border-radius: 999px; padding: 1px 9px; font-size: 11.5px; color: var(--dim); }
</style>
