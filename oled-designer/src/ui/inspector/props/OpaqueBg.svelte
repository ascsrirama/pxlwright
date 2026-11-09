<!-- "Opaque background" checkbox shared by text, image and icon. -->
<script lang="ts">
  let { el }: { el: { bg: string | null } } = $props();
</script>

<label class="check">
  <input type="checkbox" checked={el.bg !== null} onchange={(e) => (el.bg = e.currentTarget.checked ? '#000000' : null)} />
  <span>Opaque background</span>
</label>
