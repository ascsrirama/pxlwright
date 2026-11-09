<script lang="ts">
  import type { ProgressEl } from '../../../core/types';
  import Num from '../../common/Num.svelte';

  let { el }: { el: ProgressEl } = $props();
</script>

<div class="grid2">
  <Num label="Width" bind:value={el.w} min={5} max={512} />
  <Num label="Height" bind:value={el.h} min={5} max={128} />
</div>
<Num label="Value" bind:value={el.value} min={0} max={100} suffix="%" />
<Num label="Corner radius" bind:value={el.radius} min={0} max={32} />
