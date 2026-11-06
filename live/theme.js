/* AUNO appearance: apply before CSS paints to avoid a light-mode flash. */
(function () {
  'use strict';
  const KEY = 'auno-appearance';
  const modes = ['system', 'light', 'dark'];
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  function read() { try { const v = localStorage.getItem(KEY); return modes.includes(v) ? v : 'system'; } catch { return 'system'; } }
  let selected = read();
  function apply() {
    const actual = selected === 'system' ? (media.matches ? 'dark' : 'light') : selected;
    document.documentElement.dataset.theme = actual;
    document.documentElement.dataset.themePreference = selected;
    document.documentElement.style.colorScheme = actual;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = actual === 'dark' ? '#0c1715' : '#f7f8f5';
    document.dispatchEvent(new CustomEvent('auno:theme', {detail: {preference: selected, resolved: actual}}));
  }
  function set(v) {
    if (!modes.includes(v)) return;
    selected = v;
    try { localStorage.setItem(KEY, v); } catch {}
    apply();
  }
  window.AunoTheme = Object.freeze({get: () => selected, set, cycle: () => set(selected === 'dark' ? 'light' : 'dark'), resolved: () => document.documentElement.dataset.theme});
  if (media.addEventListener) media.addEventListener('change', () => {if (selected === 'system') apply();});
  else if (media.addListener) media.addListener(() => {if (selected === 'system') apply();});
  apply();
})();
