// Small date helpers. Dates are plain 'YYYY-MM-DD' text and times are 'HH:MM' text,
// so nothing depends on the database or browser time zone.
const pad = (n) => String(n).padStart(2, '0');

function ymd(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateTimeStr(date) {
  return `${ymd(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

const today = () => ymd(new Date());

function parseYmd(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text));
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.toISOString().slice(0, 10) === text ? d : null; // rejects 2026-02-31 and similar
}

function addDays(text, n) {
  const d = parseYmd(text);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const weekdayOf = (text) => parseYmd(text).getUTCDay(); // 0 = Sunday

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':');
  return +h * 60 + +m;
};
const fromMinutes = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

// A local Date for a given day and 'HH:MM'
function slotDate(dateText, hhmm) {
  const [y, mo, d] = dateText.split('-').map(Number);
  const mins = toMinutes(hhmm);
  return new Date(y, mo - 1, d, Math.floor(mins / 60), mins % 60, 0);
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 'Mon, Oct 12' and '9:00 AM' (used in SMS text)
function dateLabel(text) {
  const d = parseYmd(text);
  return `${DAYS[d.getUTCDay()].slice(0, 3)}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
function timeLabel(hhmm) {
  const mins = toMinutes(hhmm);
  const h = Math.floor(mins / 60);
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(mins % 60)} ${h >= 12 ? 'PM' : 'AM'}`;
}

module.exports = { ymd, dateTimeStr, today, parseYmd, addDays, weekdayOf, toMinutes, fromMinutes, slotDate, dateLabel, timeLabel, DAYS };
