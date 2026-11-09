<script lang="ts">
  import { untrack } from 'svelte';
  import { editor } from '../../../state/editor.svelte';
  import type { ImageEl } from '../../../core/types';
  import Num from '../../common/Num.svelte';
  import Icon from '../../common/Icon.svelte';
  import OpaqueBg from './OpaqueBg.svelte';

  let { el }: { el: ImageEl } = $props();

  let imgInput = $state<HTMLInputElement>();

  // Keep the image's 1-bit data in step with its size / threshold / invert / dither.
  $effect(() => {
    const e = el;
    void e.w;
    void e.h;
    void e.threshold;
    void e.invert;
    void e.dither;
    untrack(() => editor.rebuildImage(e));
  });

  function onReplace(ev: Event & { currentTarget: HTMLInputElement }) {
    const f = ev.currentTarget.files?.[0];
    if (f) editor.replaceImage(el, f);
    ev.currentTarget.value = '';
  }
</script>

<div class="grid2">
  <Num label="Width" bind:value={el.w} min={1} max={512} />
  <Num label="Height" bind:value={el.h} min={1} max={512} />
</div>
<Num label="Threshold" bind:value={el.threshold} min={0} max={255} />
<label class="check"><input type="checkbox" bind:checked={el.invert} /><span>Invert</span></label>
<label class="check"><input type="checkbox" bind:checked={el.dither} /><span>Dither (Floyd–Steinberg)</span></label>
<OpaqueBg {el} />
<button type="button" class="btn" onclick={() => imgInput?.click()}><Icon name="image" size={14} /> Replace image…</button>
<input bind:this={imgInput} type="file" accept="image/*" hidden onchange={onReplace} />
<p class="hint">{el.w}×{el.h} px → {Math.ceil(el.w / 8) * el.h} bytes of flash.</p>
