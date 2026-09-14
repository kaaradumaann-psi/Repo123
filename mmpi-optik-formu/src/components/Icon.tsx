type IconName = 'print' | 'left' | 'right' | 'sheet' | 'info' | 'check' | 'fit' | 'download';

const paths: Record<IconName, string> = {
  print: 'M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7zM17 11h.01',
  left: 'm14 6-6 6 6 6',
  right: 'm10 6 6 6-6 6',
  sheet: 'M14 3H5v18h14V8zM14 3v5h5M8 12h8M8 16h8',
  info: 'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  check: 'm5 12 4 4L19 6',
  fit: 'M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5',
  download: 'M12 3v12m-5-4 5 5 5-5M4 21h16',
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"><path d={paths[name]} /></svg>;
}
