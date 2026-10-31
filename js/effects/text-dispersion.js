(() => {
  window.Beyond.effects.createLetterRotation = (root, { gsap, targets, onUpdate }) => {
    let timeline, destroyed = false;
    const context = gsap.context(() => {
      timeline = gsap.timeline({ paused: true, onUpdate })
        .fromTo(targets, { rotation: 0, transformOrigin: '50% 50%' },
          { rotation: i => (i % 2 ? 1 : -1) * (180 + i * 7 % 13 * 5), duration: .7, ease: 'none' })
        .to(targets, { rotation: 0, duration: .3, ease: 'sine.inOut' });
    }, root);
    return {
      setProgress(value) { if (!destroyed) timeline.progress(Math.max(0, Math.min(1, value))); },
      destroy() { if (!destroyed) { destroyed = true; context.revert(); } },
    };
  };

  /** Seeded positions; no frame-by-frame accumulation.
   * options: gsap, targets, spread=.65, rotation=35, endOpacity=0, seed=17.
   * Owns face layer transforms only. resize preserves current progress.
   */
  window.Beyond.effects.createTextDispersion = (root, {
    gsap, targets, spread = .65, rotation = 35, endOpacity = 0, seed = 17, stagger = 0, outside = false,
  }) => {
    let context;
    let timeline;
    let progress = 0;
    let destroyed = false;
    function build() {
      context?.revert();
      let state = seed >>> 0;
      const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
      const rect = root.getBoundingClientRect();
      const frame = (root.closest('.stage') || root).getBoundingClientRect();
      const vectors = targets.map((target, index) => {
        let x = (random() - .5) * rect.width * spread * 2;
        let y = (random() - .5) * Math.max(rect.height, 160) * spread * 2;
        if (outside) {
          const box = target.getBoundingClientRect();
          const gap = Math.max(80, box.width * 2, box.height);
          if (index % 4 === 0) x = frame.left - box.right - gap;
          if (index % 4 === 1) x = frame.right - box.left + gap;
          if (index % 4 === 2) y = frame.top - box.bottom - gap;
          if (index % 4 === 3) y = frame.bottom - box.top + gap;
        }
        return { x, y, rotation: (random() - .5) * rotation * 2 };
      });
      context = gsap.context(() => {
        timeline = gsap.timeline({ paused: true }).fromTo(targets,
          { x: 0, y: 0, rotation: 0, opacity: 1 },
          { x: i => vectors[i].x, y: i => vectors[i].y, rotation: i => vectors[i].rotation,
            opacity: endOpacity, duration: 1, stagger, ease: 'power2.inOut' });
        timeline.progress(progress);
      }, root);
    }
    build();
    return {
      setProgress(value) {
        if (destroyed) return;
        progress = Math.max(0, Math.min(1, value));
        timeline.progress(progress);
      },
      resize() { if (!destroyed) build(); },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        context.revert();
      },
    };
  };
})();
