// Remembers the language the visitor picks in the footer list, so the top page stops
// redirecting them. Storage can be unavailable (private mode); then nothing is saved.
(() => {
  document.querySelectorAll('.langs a[hreflang]').forEach((a) => {
    a.addEventListener('click', () => {
      try { localStorage.setItem('recexport-lang', a.getAttribute('hreflang')); } catch (e) { /* storage off */ }
    });
  });
})();
