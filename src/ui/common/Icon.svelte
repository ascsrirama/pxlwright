<script lang="ts">
  type Name =
    | 'eye'
    | 'eye-off'
    | 'lock'
    | 'unlock'
    | 'up'
    | 'down'
    | 'copy'
    | 'trash'
    | 'undo'
    | 'redo'
    | 'download'
    | 'upload'
    | 'code'
    | 'plus'
    | 'new'
    | 'close'
    | 'fit'
    | 'image';
  let { name, size = 16 }: { name: Name; size?: number } = $props();

  const paths: Record<Name, string> = {
    eye: 'M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'eye-off': 'M3 3l18 18 M10.6 5.2A10 10 0 0 1 12 5c6.5 0 10.5 7 10.5 7a17 17 0 0 1-3.2 3.9 M6.5 6.6A16.5 16.5 0 0 0 1.5 12S5.5 19 12 19c1.7 0 3.2-.4 4.5-1 M9.9 9.9a3 3 0 0 0 4.2 4.2',
    lock: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
    unlock: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 7.5-2',
    up: 'M12 19V5 M5 12l7-7 7 7',
    down: 'M12 5v14 M5 12l7 7 7-7',
    copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
    trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6',
    undo: 'M9 14 4 9l5-5 M4 9h10a6 6 0 0 1 0 12h-3',
    redo: 'm15 14 5-5-5-5 M20 9H10a6 6 0 0 0 0 12h3',
    download: 'M12 3v12 M7 10l5 5 5-5 M4 21h16',
    upload: 'M12 21V9 M7 14l5-5 5 5 M4 3h16',
    code: 'm8 7-5 5 5 5 M16 7l5 5-5 5 M14 4l-4 16',
    plus: 'M12 5v14 M5 12h14',
    new: 'M6 3h9l4 4v14H6z M14 3v5h5',
    close: 'M6 6l12 12 M18 6 6 18',
    fit: 'M4 9V4h5 M20 9V4h-5 M4 15v5h5 M20 15v5h-5',
    image: 'M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4 M9 9.5h.01'
  };
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d={paths[name]} />
</svg>
