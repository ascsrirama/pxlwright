<script lang="ts">
  import type { RectEl } from '../../../core/types';
  import Num from '../../common/Num.svelte';

  let { el }: { el: RectEl } = $props();
</script>

<div class="grid2">
  <Num label="Width" bind:value={el.w} min={1} max={512} />
  <Num label="Height" bind:value={el.h} min={1} max={512} />
</div>
<Num label="Corner radius" bind:value={el.radius} min={0} max={64} />
<label class="check"><input type="checkbox" bind:checked={el.fill} /><span>Filled</span></label>
