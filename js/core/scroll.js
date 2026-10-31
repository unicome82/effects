(() => {
  /** Menu navigation and shared refresh; wheel scrolling stays native. */
  window.Beyond.createScroll = (roots, registry, { gsap, ScrollTrigger, header, headerOffset, onCurrent = () => {} }) => {
    let destroyed = false;
    let refreshing = false;
    let refreshFrame = 0;
    let scrollFrame = 0;
    let resizeTimer = 0;
    let ranges = [];
    const sizes = new WeakMap();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let movement = null;
    function stopMovement() {
      movement?.kill(); movement = null;
    }
    function topOf(target) {
      const top = target.getBoundingClientRect().top + window.scrollY - (headerOffset?.() || 0);
      return Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, top));
    }
    function moveTo(target, done) {
      movement?.kill(); movement = null;
      let start = window.scrollY, destination = topOf(target), from = 0;
      if (Math.abs(destination - start) < 1) { done?.(); return; }
      const progress = { value: 0 };
      movement = gsap.to(progress, { value: 1, duration: .85, ease: 'power2.inOut',
        onUpdate() {
          const next = topOf(target);
          if (Math.abs(next - destination) > 1) {
            start = window.scrollY; from = progress.value; destination = next;
          }
          const p = from < 1 ? (progress.value - from) / (1 - from) : 1;
          window.scrollTo(0, start + (destination - start) * p);
        },
        onComplete() { movement = null; measure(); done?.(); },
      });
    }
    function anchor(event) {
      const link = event.target.closest('a[href^="#"]');
      if (!link || !gsap || reduced.matches || event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      let target;
      try { target = document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch { return; }
      if (!target) return;
      event.preventDefault();
      try { if (location.hash !== link.hash) history.pushState(null, '', link.hash); } catch { location.hash = link.hash; return; }
      moveTo(target, () => target.focus({ preventScroll: true }));
    }
    document.addEventListener('wheel', stopMovement, { passive: true });
    document.addEventListener('click', anchor);
    document.addEventListener('pointerdown', stopMovement, { passive: true });
    document.addEventListener('keydown', stopMovement);
    document.addEventListener('visibilitychange', stopMovement);
    reduced.addEventListener('change', stopMovement);

    function measure() {
      const offset = headerOffset ? headerOffset() : header?.getBoundingClientRect().height || 0;
      const scroll = window.scrollY;
      ranges = roots.map(root => {
        const rect = root.getBoundingClientRect();
        return { id: root.id, start: rect.top + scroll - offset, length: Math.max(1, rect.height) };
      });
    }

    function sync() {
      scrollFrame = 0;
      if (destroyed) return;
      const scroll = window.scrollY;
      let current = ranges[0]?.id;
      ranges.forEach(range => {
        const value = (scroll - range.start) / range.length;
        if (!ScrollTrigger) registry.update(range.id, Math.max(0, Math.min(1, value)), value >= 0 && value < 1);
        if (scroll >= range.start - 1) current = range.id;
      });
      onCurrent(current);
    }

    function scheduleScroll() {
      if (!destroyed && !scrollFrame) scrollFrame = requestAnimationFrame(sync);
    }

    function onRefresh() { measure(); sync(); }

    function refresh() {
      refreshFrame = 0;
      if (destroyed || refreshing) return;
      refreshing = true;
      try {
        ScrollTrigger?.refresh();
        measure();
        sync();
      } finally { refreshing = false; }
    }

    function requestRefresh() {
      if (!destroyed && !refreshing && !refreshFrame) refreshFrame = requestAnimationFrame(refresh);
    }

    function onResize() {
      stopMovement();
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(requestRefresh, 120);
    }
    function onHash() { stopMovement(); scheduleScroll(); }

    function onAsset(event) {
      if (event.target.tagName === 'IMG') requestRefresh();
    }

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => {
      let changed = false;
      entries.forEach(({ target, contentRect }) => {
        const next = contentRect.width + ':' + contentRect.height;
        if (sizes.get(target) !== next) { sizes.set(target, next); changed = true; }
      });
      if (changed) requestRefresh();
    }) : null;
    [...roots, header].filter(Boolean).forEach(root => observer?.observe(root));
    window.addEventListener('scroll', scheduleScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('hashchange', onHash);
    document.addEventListener('load', onAsset, true);
    document.addEventListener('error', onAsset, true);
    document.fonts?.addEventListener('loadingdone', requestRefresh);
    ScrollTrigger?.addEventListener('refresh', onRefresh);
    measure();

    return {
      requestRefresh,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        stopMovement();
        document.removeEventListener('wheel', stopMovement);
        document.removeEventListener('click', anchor);
        document.removeEventListener('pointerdown', stopMovement);
        document.removeEventListener('keydown', stopMovement);
        document.removeEventListener('visibilitychange', stopMovement);
        reduced.removeEventListener('change', stopMovement);
        clearTimeout(resizeTimer);
        cancelAnimationFrame(refreshFrame);
        cancelAnimationFrame(scrollFrame);
        observer?.disconnect();
        window.removeEventListener('scroll', scheduleScroll);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('hashchange', onHash);
        document.removeEventListener('load', onAsset, true);
        document.removeEventListener('error', onAsset, true);
        document.fonts?.removeEventListener('loadingdone', requestRefresh);
        ScrollTrigger?.removeEventListener('refresh', onRefresh);
      },
    };
  };
})();
