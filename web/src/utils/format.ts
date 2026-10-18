import { t } from '../store/i18n';

export function clamp(n: number, min: number, max: number): number {
  return n < min ? min : n > max ? max : n;
}

export function formatCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n < 1000) return String(Math.round(n));
  if (n < 1000000) {
    const k = n / 1000;
    return `${k >= 100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')}${t('count_k')}`;
  }
  return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}${t('count_m')}`;
}

export function timeAgo(ts: number | string): string {
  const tTime = typeof ts === 'number' ? ts : Date.parse(ts);
  if (!Number.isFinite(tTime)) return '';
  const diff = Math.max(0, Date.now() - tTime);
  const min = 60000;
  const hour = 3600000;
  const day = 86400000;
  if (diff < 45000) return t('time_just_now');
  if (diff < hour) return t('time_mins_ago', { n: Math.floor(diff / min) });
  if (diff < day) return t('time_hours_ago', { n: Math.floor(diff / hour) });
  if (diff < 7 * day) return t('time_days_ago', { n: Math.floor(diff / day) });
  const d = new Date(tTime);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60) % 60;
  const h = Math.floor(sec / 3600);
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

export function formatDate(ts: number | string): string {
  const t = typeof ts === 'number' ? ts : Date.parse(ts);
  const d = new Date(Number.isFinite(t) ? t : Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function initialsOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const cjk = trimmed.charCodeAt(0);
  if (cjk > 0x2e80) return trimmed.slice(0, 1);
  return trimmed.slice(0, 2).toUpperCase();
}

export function tagOf(caption: string): string[] {
  const out: string[] = [];
  const re = /#([^\s#]{1,24})/g;
  let m = re.exec(caption);
  while (m) {
    if (!out.includes(m[1])) out.push(m[1]);
    m = re.exec(caption);
  }
  return out.slice(0, 4);
}

export function firstLine(s: string): string {
  return s.split('\n')[0] ?? '';
}

export function colorAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return `rgba(254,44,85,${alpha})`;
  const v = parseInt(m[1], 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${alpha})`;
}
