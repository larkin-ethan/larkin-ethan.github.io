window.SiteMode = (function () {
  var KEY = 'site-mode';
  var subscribers = [];

  function get() {
    try {
      var stored = localStorage.getItem(KEY);
      if (stored === 'raw' || stored === 'interactive') return stored;
    } catch (e) {}
    return 'raw';
  }

  function set(mode) {
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    subscribers.forEach(function (fn) { fn(mode); });
  }

  function subscribe(fn) { subscribers.push(fn); }

  return { get: get, set: set, subscribe: subscribe };
})();

(function () {
  var toggle = document.getElementById('modeToggle');
  if (!toggle) return;
  var buttons = Array.prototype.slice.call(toggle.querySelectorAll('.mode-btn'));

  function reflect(mode) {
    buttons.forEach(function (b) { b.classList.toggle('active', b.dataset.mode === mode); });
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { SiteMode.set(b.dataset.mode); });
  });

  SiteMode.subscribe(reflect);
  reflect(SiteMode.get());
})();
