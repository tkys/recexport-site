// Hero deck: one sheet per destination, stacked. The front sheet moves to the back and the
// next one comes forward. Advances slowly on its own, stops for good once the visitor picks a
// tab, pauses on hover and focus, never auto-advances under reduced motion.
// The headline word and its logo follow the front card. On narrow screens the tab buttons are
// hidden by CSS and only Pause stays.
(() => {
  const group = document.querySelector('.sheet__tabs');
  const cards = [...document.querySelectorAll('.deck__card')];
  if (!group || !cards.length) return;
  const tabs = [...group.querySelectorAll('.tab:not([data-pause])')];
  const pauseBtn = group.querySelector('[data-pause]');
  const rotor = document.querySelector('[data-rotor]');
  const rotorText = rotor ? rotor.querySelector('[data-rotor-text]') || rotor : null;
  const rotorLogo = rotor ? rotor.querySelector('.rotor__logo') : null;
  tabs.forEach((t) => { if (t.dataset.logo) new Image().src = t.dataset.logo; });
  const area = group.closest('.hero__visual') || group;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let front = 0, timer = null, stopped = reduce, hovering = false;

  const show = (n) => {
    front = (n + cards.length) % cards.length;
    cards.forEach((c, k) => {
      const pos = (k - front + cards.length) % cards.length;
      c.dataset.pos = String(pos);
      if (pos === 0) c.removeAttribute('aria-hidden'); else c.setAttribute('aria-hidden', 'true');
    });
    tabs.forEach((t, k) => t.setAttribute('aria-pressed', String(k === front)));
    if (rotorText) rotorText.textContent = tabs[front].dataset.dest;
    if (rotorLogo && tabs[front].dataset.logo) rotorLogo.src = tabs[front].dataset.logo;
  };
  const tick = () => { if (!stopped && !hovering) show(front + 1); };
  const start = () => { if (!stopped && !timer) timer = setInterval(tick, 3500); };
  const halt = () => { clearInterval(timer); timer = null; };

  group.hidden = false;
  if (!reduce && pauseBtn) pauseBtn.hidden = false;

  tabs.forEach((t, k) => t.addEventListener('click', () => {
    stopped = true; halt(); show(k);
    if (pauseBtn) pauseBtn.hidden = true;
  }));
  if (pauseBtn) pauseBtn.addEventListener('click', () => {
    stopped = !stopped;
    pauseBtn.setAttribute('aria-pressed', String(stopped));
    pauseBtn.textContent = stopped ? (pauseBtn.dataset.play || 'Play') : (pauseBtn.dataset.pauseLabel || 'Pause');
    if (stopped) halt(); else start();
  });
  area.addEventListener('pointerenter', () => { hovering = true; });
  area.addEventListener('pointerleave', () => { hovering = false; });
  area.addEventListener('focusin', () => { hovering = true; });
  area.addEventListener('focusout', () => { hovering = false; });
  document.addEventListener('visibilitychange', () => (document.hidden ? halt() : start()));
  start();
})();
