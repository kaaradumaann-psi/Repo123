type IconName =
  | 'print'
  | 'left'
  | 'right'
  | 'sheet'
  | 'check'
  | 'fit'
  | 'download'
  | 'user'
  | 'users'
  | 'trash'
  | 'eye'
  | 'scan'
  | 'shield'
  | 'search'
  | 'refresh'
  | 'camera'
  | 'file'
  | 'alert'
  | 'close'
  | 'checkCircle'
  | 'arrowRight'
  | 'sparkles'
  | 'external';

const paths: Record<IconName, string> = {
  print: 'M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7zM17 11h.01',
  left: 'm14 6-6 6 6 6',
  right: 'm10 6 6 6-6 6',
  sheet: 'M14 3H5v18h14V8zM14 3v5h5M8 12h8M8 16h8',
  check: 'm5 12 4 4L19 6',
  fit: 'M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5',
  download: 'M12 3v12m-5-4 5 5 5-5M4 21h16',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  users: 'M17 21v-2a4 4 0 0 0-3-3.87M9 21v-2a4 4 0 0 1 3-3.87M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 10v-2a4 4 0 0 0-2-3.46M16 3.13a4 4 0 0 1 0 7.75',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  scan: 'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M4 12h16',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2-4.35-4.35',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  alert: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  close: 'M18 6 6 18M6 6l12 12',
  checkCircle: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  sparkles: 'm12 3 1.91 5.89L20 10.8l-4.59 3.96L16.82 21 12 17.27 7.18 21l1.41-6.24L4 10.8l6.09-1.91L12 3z',
  external: 'M7 17 17 7M9 7h8v8',
};

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
