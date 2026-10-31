(() => {
  const app = window.Beyond;
  let registered = null;
  let pending = null;
  let generation = 0;
  let running = false;
  let registry;
  let scroll;
  let navigation;
  let transitions;
  let opening;
  let cancelFonts = () => {};

  function waitForFonts() {
    if (!document.fonts) return Promise.resolve();
    return new Promise(resolve => {
      const done = () => { clearTimeout(timer); resolve(); };
      const timer = setTimeout(done, 2000);
      cancelFonts = done;
      document.fonts.ready.then(done, done);
    });
  }

  function destroy() {
    generation++;
    cancelFonts();
    pending = null;
    scroll?.destroy();
    opening?.destroy(); opening = null;
    registry?.destroy();
    navigation?.destroy();
    transitions?.destroy();
    scroll = registry = navigation = transitions = null;
    running = false;
    document.querySelector('#chapters').removeAttribute('data-initialized');
  }

  function init() {
    if (pending) return pending;
    if (running) return Promise.resolve(registry);
    const version = ++generation;
    pending = (async () => {
      const mount = document.querySelector('#chapters');
      const roots = [...mount.querySelectorAll(':scope > section[data-chapter]')];
      if (!roots.length) throw new Error('Chapter sections are required');
      const result = await app.loadVendors();
      if (version !== generation) return null;
      await waitForFonts();
      if (version !== generation) return null;
      const notice = document.querySelector('[data-vendor-status]');
      notice.hidden = result.ready;
      notice.textContent = result.ready ? '' : result.failed.join(', ') + ' 연결 실패. 기본 화면과 탐색을 사용합니다.';
      const gsap = result.ready ? window.gsap : null;
      const ScrollTrigger = result.ready ? window.ScrollTrigger : null;
      if (gsap && registered !== ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        registered = ScrollTrigger;
      }
      const header = document.querySelector('.site-header');
      const context = {
        $: window.jQuery, gsap, ScrollTrigger,
        headerOffset: () => 0,
        requestRefresh: () => scroll?.requestRefresh(),
        onActiveChange: () => transitions?.update(),
      };
      try {
        navigation = app.createNavigation(document, context);
        registry = app.createRegistry(roots, context);
        registry.init();
        transitions = app.createTransitions(roots, context);
        scroll = app.createScroll(roots, registry, { ...context, header, onCurrent(id) { navigation.update(id); transitions.update(id); } });
        running = true;
        mount.dataset.initialized = 'true';
        if (location.hash) {
          try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(); } catch { /* Invalid hash. */ }
        }
        scroll.requestRefresh();
        document.dispatchEvent(new CustomEvent('chapters:ready', { detail: { roots, ...context } }));
        return registry;
      } catch (error) { destroy(); throw error; }
    })().finally(() => { if (version === generation) pending = null; });
    return pending;
  }

  app.motion = {
    init, destroy,
    requestRefresh: () => scroll?.requestRefresh(),
    get registry() { return registry; },
  };
  window.addEventListener('pagehide', destroy);
  window.addEventListener('pageshow', event => { if (event.persisted) start(); });
  function start() {
    opening ||= app.createOpening?.();
    init().catch(() => {
      const notice = document.querySelector('[data-vendor-status]');
      notice.hidden = false;
      notice.textContent = '모션 초기화에 실패했습니다. 기본 콘텐츠와 앵커 탐색은 사용할 수 있습니다.';
    });
  }
  start();
})();
