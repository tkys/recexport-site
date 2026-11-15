// Keep the sample folders in the hero current: dates in file names and in the "modified" column
// are moved so the newest recording in every card was saved a minute ago, in the visitor's own
// time zone, and the older ones keep their distance in days. The format each card already uses
// is kept (numeric dates keep their separators, month-name dates are rebuilt with Intl in the
// page's language, relative words such as "Yesterday" are left alone). Without JavaScript the
// page shows the dates it was written with.
(() => {
  const lang = document.documentElement.lang || 'en';
  const pad = (n) => String(n).padStart(2, '0');
  const DAY = 86400000;
  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const NAME = /^(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})/;
  const TIME = /(\d{1,2}):(\d{2})(\s*[ap]m)?/i;
  const NUMERIC_DATE = /(\d{4})([/-])(\d{2})\2(\d{2})/;

  const fmtTime = (d, sample) => {
    const m = sample.match(TIME);
    if (m && m[3]) {
      const h = d.getHours() % 12 || 12;
      return `${h}:${pad(d.getMinutes())}${m[3].replace(/[ap]m/i, d.getHours() < 12 ? 'am' : 'pm')}`;
    }
    return `${m && m[1].length === 2 ? pad(d.getHours()) : d.getHours()}:${pad(d.getMinutes())}`;
  };
  const withTime = (text, d) => text.replace(TIME, (s) => fmtTime(d, s));

  // Rebuild a month-name date ("11月11日", "Nov 11", "8 Nov 2026") in the page language.
  const monthNameDate = (part, d) => {
    const hasYear = /\d{4}/.test(part);
    const opts = { month: 'short', day: 'numeric' };
    if (hasYear) opts.year = 'numeric';
    let loc = lang;
    if (hasYear && lang === 'en' && /^\d/.test(part.trim())) loc = 'en-GB';
    return new Intl.DateTimeFormat(loc, opts).format(d);
  };

  const rewriteWhen = (cell, d, isNewest) => {
    const text = cell.textContent;
    if (!/\d/.test(text)) return;                          // "Just now", "Yesterday"
    const numeric = text.match(NUMERIC_DATE);
    if (numeric) {
      let out = text.replace(NUMERIC_DATE, (s, y, sep) => `${d.getFullYear()}${sep}${pad(d.getMonth() + 1)}${sep}${pad(d.getDate())}`);
      if (isNewest) out = withTime(out, d);
      cell.textContent = out;
      return;
    }
    const time = text.match(TIME);
    const datePart = (time ? text.slice(0, time.index) : text).replace(/\s*(at|um|às|às)?\s*$/i, '');
    if (!/\d/.test(datePart)) {                            // "Today 19:42", "14:41"
      if (isNewest) cell.textContent = withTime(text, d);
      return;
    }
    cell.textContent = text.replace(datePart, monthNameDate(datePart, d));
  };

  const now = new Date();
  const today = midnight(now);

  document.querySelectorAll('.deck__card').forEach((card) => {
    const rows = [...card.querySelectorAll('tbody tr')].map((tr) => {
      const nameEl = tr.querySelector('.name span');
      const whenEl = tr.querySelector('.when');
      const m = nameEl && nameEl.textContent.match(NAME);
      if (!m || !whenEl) return null;
      const start = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
      const t = whenEl.textContent.match(TIME);
      let saved = null;
      if (t) {
        let h = +t[1];
        if (t[3]) h = (h % 12) + (/pm/i.test(t[3]) ? 12 : 0);
        saved = new Date(start.getFullYear(), start.getMonth(), start.getDate(), h, +t[2]);
      }
      return { nameEl, whenEl, start, saved };
    }).filter(Boolean);
    if (!rows.length) return;

    const newestDay = midnight(rows[0].start);
    rows.forEach((r, i) => {
      const daysBack = Math.round((newestDay - midnight(r.start)) / DAY);
      let start, saved;
      if (i === 0) {
        const gap = r.saved && r.saved > r.start ? r.saved - r.start : 40 * 60000;
        saved = new Date(now.getTime() - 60000);
        start = new Date(saved.getTime() - gap);
      } else {
        const day = new Date(today.getTime() - daysBack * DAY);
        start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), r.start.getHours(), r.start.getMinutes());
        saved = r.saved ? new Date(day.getFullYear(), day.getMonth(), day.getDate(), r.saved.getHours(), r.saved.getMinutes()) : start;
      }
      r.nameEl.textContent = r.nameEl.textContent.replace(NAME,
        `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}_${pad(start.getHours())}${pad(start.getMinutes())}`);
      rewriteWhen(r.whenEl, saved, i === 0);
    });
  });
})();
