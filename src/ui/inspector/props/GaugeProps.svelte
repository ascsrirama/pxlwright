<script lang="ts">
  import type { GaugeEl } from '../../../core/types';
  import Num from '../../common/Num.svelte';

  let { el }: { el: GaugeEl } = $props();
</script>

<div class="grid2">
  <Num label="Radius" bind:value={el.r} min={4} max={256} />
  <Num label="Thickness" bind:value={el.thickness} min={1} max={64} />
</div>
<Num label="Value" bind:value={el.value} min={0} max={100} suffix="%" />
<div class="grid2">
  <Num label="Start angle" bind:value={el.startAngle} min={-360} max={720} suffix="°" />
  <Num label="Sweep" bind:value={el.sweep} min={10} max={360} suffix="°" />
</div>
<p class="hint">0° is 3 o’clock, angles run clockwise. 135° / 270° gives the classic open-bottom gauge.</p>
