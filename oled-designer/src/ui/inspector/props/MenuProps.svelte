<script lang="ts">
  import type { MenuEl } from '../../../core/types';
  import Num from '../../common/Num.svelte';

  let { el }: { el: MenuEl } = $props();
</script>

<label class="field">
  <span>Items (one per line)</span>
  <textarea
    rows="4"
    spellcheck="false"
    value={el.items.join('\n')}
    oninput={(e) => (el.items = e.currentTarget.value.split('\n').slice(0, 16))}
  ></textarea>
</label>
<div class="grid2">
  <Num label="Selected" bind:value={el.selected} min={0} max={Math.max(0, el.items.length - 1)} />
  <Num label="Text size" bind:value={el.size} min={1} max={3} suffix="×" />
</div>
<Num label="Width" bind:value={el.w} min={8} max={512} />
