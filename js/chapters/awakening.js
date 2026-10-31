(() => {
  const app = window.Beyond;
  app.chapters.awakening = (root, context) => {
    if (!context.gsap || !context.ScrollTrigger) {
      root.dataset.motion = 'static';
      return app.initChapter(root, context);
    }
    const { gsap, ScrollTrigger } = context;
    const visual = root.querySelector('.visual');
    const desktop = matchMedia('(min-width: 769px)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const previousMode = root.getAttribute('data-motion');
    let base;
    let reveal;
    let dispersion;
    let proximity;
    let rotation;
    let weightLoop, weightContext;
    let mode;
    let destroyed = false;
    let near = false, entered = false;
    let travel = 1;

    function render(value, isActive) {
      rotation?.setProgress(value);
      dispersion?.setProgress((value * travel - 2000) / Math.max(1, travel - 2000));
      activate();
      context.onChange(value, isActive);
    }
    function onReveal() { entered = true; proximity?.measure(); activate(); }
    function activate() {
      if (destroyed) return;
      const rect = root.getBoundingClientRect();
      const active = near && rect.top <= context.headerOffset() + 1 && rect.bottom > 0 &&
        !root.hasAttribute('data-departing') && !document.body.classList.contains('is-opening') && !document.hidden;
      if (active && !entered) reveal?.play(onReveal);
      else if (!active) reveal?.pause();
      proximity?.setActive(active && entered);
      if (active && entered) weightLoop?.play(); else weightLoop?.pause();
    }
    function clear() {
      base?.destroy();
      base = null;
      rotation?.destroy(); rotation = null;
      dispersion?.destroy();
      weightContext?.revert(); weightLoop = weightContext = null;
      proximity?.destroy();
      reveal?.destroy();
      dispersion = proximity = reveal = null; entered = false;
    }
    function build() {
      if (destroyed) return;
      clear();
      mode = reduced.matches ? 'reduced' : desktop.matches ? 'desktop' : 'mobile';
      root.dataset.motion = mode;
      try {
        reveal = app.effects.createTextReveal(visual, { gsap, startOpacity: 0 });
        const letters = reveal.glyphs.filter(node => node.classList.contains('glyph'));
        const weights = letters.map(() => ({ value: 200 }));
        proximity = app.effects.createProximityType(visual, {
          copy: visual, targets: letters, liveBounds: true, baseWeight: index => weights[index].value,
        });
        if (mode !== 'reduced') {
          weightContext = gsap.context(() => {
            weightLoop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 2 });
            weights.forEach((weight, index) => weightLoop.to(weight, {
              value: 900, duration: .35, repeat: 1, yoyo: true, ease: 'sine.inOut', onUpdate: proximity.update,
            }, index * .12));
          }, root);
          rotation = app.effects.createLetterRotation(visual, { gsap, targets: letters, onUpdate: proximity.update });
          dispersion = app.effects.createTextDispersion(visual, {
            gsap,
            targets: [...visual.querySelectorAll('.face')].filter(node => !node.closest('.accent')),
            spread: mode === 'desktop' ? .65 : .045,
            rotation: mode === 'desktop' ? 35 : 0,
            endOpacity: mode === 'desktop' ? 0 : .45,
          });
        } else { reveal.setProgress(1); entered = true; proximity.measure(); }
        travel = Math.max(1, root.offsetHeight - innerHeight);
        base = app.initChapter(root, { ...context, onChange: render }, {
          end: mode !== 'reduced' ? 'bottom bottom' : undefined,
        });
        context.requestRefresh();
      } catch (error) {
        clear();
        restoreMode();
        throw error;
      }
    }
    function restoreMode() {
      if (previousMode === null) root.removeAttribute('data-motion');
      else root.setAttribute('data-motion', previousMode);
    }
    function onRefresh() { travel = Math.max(1, root.offsetHeight - innerHeight); dispersion?.resize(); if (entered) proximity?.measure(); }
    build();
    const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      near = entries[0].isIntersecting; activate();
    }) : null;
    if (observer) observer.observe(root);
    else { near = true; activate(); }
    root.addEventListener('chapter:transition', activate);
    document.addEventListener('opening:end', activate);
    document.addEventListener('visibilitychange', activate);
    desktop.addEventListener('change', build);
    reduced.addEventListener('change', build);
    ScrollTrigger.addEventListener('refreshInit', onRefresh);
    return {
      setProgress(value, isActive) { if (!destroyed) base.setProgress(value, isActive); },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        observer?.disconnect();
        root.removeEventListener('chapter:transition', activate);
        document.removeEventListener('opening:end', activate);
        document.removeEventListener('visibilitychange', activate);
        desktop.removeEventListener('change', build);
        reduced.removeEventListener('change', build);
        ScrollTrigger.removeEventListener('refreshInit', onRefresh);
        clear();
        restoreMode();
      },
    };
  };
})();
