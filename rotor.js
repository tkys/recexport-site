// Hero deck: one sheet per destination, stacked. The front sheet moves to the back and the
// next one comes forward. Advances on its own, stops for good once the visitor picks a tab,
// pauses on hover and focus.
// The headline word follows the front card and carries an underline in that destination's
// colour, so the switch is visible even without motion. With motion allowed, the underline
// fills from left to right as a timer and the next destination comes when it is full (the
// animation's end drives the switch, so pausing the animation pauses the timer exactly).
// Under reduced motion the underline is drawn full, a plain interval drives the switch, and
// CSS swaps the cards without any transition.
// On narrow screens the tab buttons are hidden by CSS and only Pause stays.
(() => {
  const group = document.querySelector('.sheet__tabs');
  const cards = [...document.querySelectorAll('.deck__card')];
  if (!group || !cards.length) return;
  const tabs = [...group.querySelectorAll('.tab:not([data-pause])')];
  const pauseBtn = group.querySelector('[data-pause]');
  const rotor = document.querySelector('[data-rotor]');
  const rotorText = rotor ? rotor.querySelector('[data-rotor-text]') || rotor : null;
  const area = group.closest('.hero__visual') || group;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STEP = 3500;
  let front = 0, timer = null, stopped = false, hovering = false;

  const destOf = (card) => (card.className.match(/\bdest--(\w+)/) || [])[1] || '';

  // Restart the underline timer (motion only).
  const restartFill = () => {
    if (!rotor || reduce) return;
    rotor.classList.remove('is-timing');
    void rotor.offsetWidth;
    if (!stopped) rotor.classList.add('is-timing');
  };
  const syncPaused = () => {
    if (rotor) rotor.classList.toggle('is-paused', hovering || document.hidden);
  };

  const show = (n) => {
    front = (n + cards.length) % cards.length;
    cards.forEach((c, k) => {
      const pos = (k - front + cards.length) % cards.length;
      c.dataset.pos = String(pos);
      if (pos === 0) c.removeAttribute('aria-hidden'); else c.setAttribute('aria-hidden', 'true');
    });
    tabs.forEach((t, k) => t.setAttribute('aria-pressed', String(k === front)));
    if (rotorText) rotorText.textContent = tabs[front].dataset.dest;
    if (rotor) rotor.dataset.dest = destOf(cards[front]);
    restartFill();
  };

  // Reduced motion: a plain interval.
  const tick = () => { if (!stopped && !hovering) show(front + 1); };
  const start = () => {
    if (stopped) return;
    if (reduce) { if (!timer) timer = setInterval(tick, STEP); } else restartFill();
  };
  const halt = () => {
    clearInterval(timer); timer = null;
    if (rotor) rotor.classList.remove('is-timing');
  };

  // Motion: the end of the underline fill advances the deck.
  if (rotor && !reduce) {
    rotor.style.setProperty('--rotor-step', `${STEP}ms`);
    rotor.addEventListener('animationend', (e) => {
      if (e.animationName === 'rotor-fill' && !stopped) show(front + 1);
    });
  }

  group.hidden = false;
  if (pauseBtn) pauseBtn.hidden = false;

  tabs.forEach((t, k) => t.addEventListener('click', () => {
    stopped = true; halt(); show(k);
    if (pauseBtn) pauseBtn.hidden = true;
  }));
  if (pauseBtn) pauseBtn.addEventListener('click', () => {
    stopped = !stopped;
    pauseBtn.setAttribute('aria-pressed', String(stopped));
    pauseBtn.textContent = stopped ? (pauseBtn.dataset.play || 'Play') : (pauseBtn.dataset.pauseLabel || 'Pause');
    if (reduce) { if (stopped) halt(); else start(); }
    // Motion: freeze the underline where it is, and carry on from there on Play.
    else if (rotor) rotor.classList.toggle('is-held', stopped);
  });
  const setHover = (v) => { hovering = v; syncPaused(); };
  area.addEventListener('pointerenter', () => setHover(true));
  area.addEventListener('pointerleave', () => setHover(false));
  area.addEventListener('focusin', () => setHover(true));
  area.addEventListener('focusout', () => setHover(false));
  document.addEventListener('visibilitychange', () => {
    syncPaused();
    if (reduce) { if (document.hidden) { clearInterval(timer); timer = null; } else start(); }
  });
  show(0);
  start();
})();
