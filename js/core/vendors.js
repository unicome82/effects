(() => {
const vendors = [
  ['jQuery', 'https://code.jquery.com/jquery-3.7.1.min.js', () => globalThis.jQuery?.fn.jquery === '3.7.1'],
  ['GSAP', 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js', () => globalThis.gsap?.version === '3.12.5'],
  ['ScrollTrigger', 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js', () => globalThis.ScrollTrigger?.version === '3.12.5'],
];

/** Load classic scripts once, in dependency order, with a finite wait. */
window.Beyond = window.Beyond || {};
let pending;
let threePending;
window.Beyond.loadThree = () => threePending || (threePending = new Promise((resolve, reject) => {
  if (window.THREE?.REVISION === '160') return resolve(window.THREE);
  const script = document.createElement('script');
  const timer = setTimeout(() => finish(false), 8000);
  function finish(ok) {
    clearTimeout(timer);
    script.onload = script.onerror = null;
    if (ok) resolve(window.THREE);
    else { script.remove(); reject(new Error('Three.js unavailable')); }
  }
  script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js';
  script.onload = () => finish(window.THREE?.REVISION === '160');
  script.onerror = () => finish(false);
  document.head.append(script);
}));
window.Beyond.loadVendors = () => pending || (pending = load());
async function load() {
  const failed = [];
  for (const [name, url, available] of vendors) {
    try {
      await new Promise((resolve, reject) => {
        if (available()) return resolve();
        const script = document.createElement('script');
        const timer = setTimeout(() => finish(false), 8000);
        function finish(ok) {
          clearTimeout(timer);
          script.onload = script.onerror = null;
          if (ok) resolve();
          else { script.remove(); reject(new Error(name)); }
        }
        script.src = url;
        script.onload = () => finish(available());
        script.onerror = () => finish(false);
        document.head.append(script);
      });
    } catch { failed.push(name); }
  }
  return { ready: failed.length === 0, failed };
};
})();
