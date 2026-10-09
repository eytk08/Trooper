export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT = DAY_NAMES.map((d) => d.slice(0, 3));
// Monday first, as staff think about a working week
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function fmtDate(ymd, withYear = false) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC',
  });
}

export function fmtTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// Today's date as YYYY-MM-DD in the browser's own time zone
export const todayYmd = () => new Date().toLocaleDateString('en-CA');
