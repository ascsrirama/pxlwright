<script lang="ts">
  let {
    value = $bindable(0),
    label,
    min = -9999,
    max = 9999,
    step = 1,
    suffix = ''
  }: { value: number; label: string; min?: number; max?: number; step?: number; suffix?: string } = $props();

  function onInput(e: Event & { currentTarget: HTMLInputElement }) {
    const v = e.currentTarget.valueAsNumber;
    if (!Number.isFinite(v)) return; // ignore an empty / half-typed field
    const q = step >= 1 ? Math.round(v) : v;
    value = Math.min(max, Math.max(min, q));
  }
</script>

<label class="field">
  <span>{label}</span>
  <span class="num">
    <input type="number" {min} {max} {step} {value} oninput={onInput} />
    {#if suffix}<em>{suffix}</em>{/if}
  </span>
</label>

<style>
  .num { display: flex; align-items: center; gap: 6px; }
  .num em { font-style: normal; color: var(--dim); font-size: 11.5px; white-space: nowrap; }
</style>
