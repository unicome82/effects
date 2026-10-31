(() => {
  const app = window.Beyond;
  app.chapters.typography = (root, context) => {
    if (!context.gsap || !context.ScrollTrigger) return app.initChapter(root, context);
    const { gsap, ScrollTrigger } = context;
    const visual = root.querySelector('.visual');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const previous = ['motion', 'font'].map(key => root.getAttribute('data-' + key));
    let base, reveal, gather, sceneContext, sceneTimeline, weightTimeline;
    let mode;
    let destroyed = false;

    function render(progress, active) {
      // Gather, hold, increase each letter's weight, then zoom.
      const phase = progress * 1.5;
      reveal?.setProgress(1);
      gather?.setProgress(1 - Math.max(0, Math.min(1, phase / .5)));
      weightTimeline?.progress(Math.max(0, Math.min(1, (phase - .78) / .37)));
      sceneTimeline?.progress(Math.max(0, Math.min(1, (phase - 1.15) / .35)));
      context.onChange(progress, active);
    }
    function clear() {
      base?.destroy();
      sceneContext?.revert();
      gather?.destroy();
      reveal?.destroy();
      base = sceneContext = sceneTimeline = weightTimeline = gather = reveal = null;
    }
    function restore() {
      ['motion', 'font'].forEach((key, index) => {
        if (previous[index] === null) root.removeAttribute('data-' + key);
        else root.setAttribute('data-' + key, previous[index]);
      });
    }
    function build() {
      if (destroyed) return;
      clear();
      mode = reduced.matches ? 'reduced' : 'scroll';
      root.dataset.motion = mode;
      root.dataset.font = 'static';
      try {
        if (mode === 'scroll') {
          reveal = app.effects.createTextReveal(visual, { gsap, distance: 24, stagger: .018 });
          const letters = [...visual.querySelectorAll('.glyph')];
          gather = app.effects.createTextDispersion(visual, { gsap, targets: letters.map(letter => letter.querySelector('.face')), spread: .35, rotation: 18, endOpacity: 0, seed: 29, stagger: -.025, outside: true });
          root.dataset.font = document.fonts && [...document.fonts].some(face =>
            face.family.replace(/['"]/g, '') === 'Pretendard Variable' && face.status === 'loaded') ? 'variable' : 'fallback';
          sceneContext = gsap.context(() => {
            weightTimeline = gsap.timeline({ paused: true }).fromTo(letters,
              { fontVariationSettings: '"wght" 100' },
              { fontVariationSettings: '"wght" 900', duration: 1, stagger: 1, ease: 'sine.inOut' });
            const stage = root.querySelector('.stage');
            const title = root.querySelector('h2');
            sceneTimeline = gsap.timeline({ paused: true })
              .fromTo(visual, { scale: 1, x: 0, y: 0, transformOrigin: '50% 50%' }, {
                scale: 10,
                x: () => stage.clientWidth / 2 - title.offsetLeft - visual.offsetWidth / 2,
                y: () => stage.clientHeight / 2 - title.offsetTop - visual.offsetHeight / 2,
                duration: 1, ease: 'power1.in',
              }, 0)
              .fromTo(root, { '--reveal': 0 }, { '--reveal': 1, duration: .45, ease: 'sine.inOut' }, 1)
              .fromTo(visual, { opacity: 1 }, { opacity: 0, duration: .8, ease: 'sine.in' }, .2)
              .fromTo(root.querySelector('.intro'),
                { opacity: 1 }, { opacity: 0, duration: .25, ease: 'none' }, 0);
          }, root);
        }
        base = app.initChapter(root, { ...context, onChange: render }, {
          end: mode === 'scroll' ? 'bottom bottom' : undefined,
        });
        context.requestRefresh();
      } catch (error) { clear(); restore(); throw error; }
    }
    function onFontReady() {
      if (mode === 'scroll' && root.dataset.font === 'fallback' &&
          [...document.fonts].some(face => face.family.replace(/['"]/g, '') === 'Pretendard Variable' && face.status === 'loaded')) build();
    }
    function onRefresh() {
      gather?.resize();
      if (sceneTimeline) {
        const p = sceneTimeline.progress();
        sceneTimeline.invalidate().progress(1, true).progress(p, true);
      }
    }
    build();
    reduced.addEventListener('change', build);
    document.fonts?.addEventListener('loadingdone', onFontReady);
    ScrollTrigger.addEventListener('refreshInit', onRefresh);
    return {
      setProgress(value, active) { if (!destroyed) base?.setProgress(value, active); },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        reduced.removeEventListener('change', build);
        document.fonts?.removeEventListener('loadingdone', onFontReady);
        ScrollTrigger.removeEventListener('refreshInit', onRefresh);
        clear();
        restore();
      },
    };
  };
})();
