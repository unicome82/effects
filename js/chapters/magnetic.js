(() => {
  const app = window.Beyond;
  app.chapters.magnetic = (root, context) => {
    if (!context.gsap) return app.initChapter(root, context, { end: 'bottom bottom' });
    const { gsap } = context;
    const previousMode = root.getAttribute('data-motion');
    const field = root.querySelector('.field');
    const pattern = field.querySelector('.pattern');
    const bars = [...field.querySelectorAll('.bar')];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let progress = 0, drift, motion, entrance;
    let near = false, shown = false, destroyed = false;
    function render(value, active) {
      progress = value; drift?.progress(value);
      activate();
      context.onChange(value, active);
    }
    const styles = gsap.context(() => {
      const direction = Math.random() < .5 ? -1 : 1;
      bars.forEach((bar, index) => gsap.set(bar, {
        '--angle': direction * ((index + Math.floor(index / 10)) % 2 ? -1 : 1) * (4 + Math.random() * 16) + 'deg',
      }));
      gsap.set(bars, { opacity: 0 });
    }, root);
    const effect = app.effects.createMagneticCursor(field, context);
    function build() {
      motion?.revert(); motion = drift = null;
      root.dataset.motion = reduced.matches ? 'static' : 'scroll';
      if (!reduced.matches) motion = gsap.context(() => {
        const distance = pattern.scrollHeight;
        const travel = parseFloat(getComputedStyle(root).getPropertyValue('--travel')) || 4000;
        const span = Math.min(1, innerHeight / travel), speed = Math.max(1, travel / Math.max(1, distance));
        // Match the last viewport's bar speed to the following native scroll.
        const ease = value => {
          if (value <= 1 - span) return value;
          const t = (value - 1 + span) / span;
          return 1 - span + span * (t - t * t / 2 + Math.pow(t, 2 * speed) / 2);
        };
        drift = gsap.timeline({ paused: true, onUpdate: effect.update })
          .fromTo(pattern, { y: 0 }, { y: -distance, duration: 1, ease });
        drift.progress(progress);
      }, root);
      activate();
    }
    function activate() {
      if (destroyed) return;
      if (reduced.matches) {
        entrance?.kill(); entrance = null; shown = true;
        gsap.set(bars, { opacity: 1 }); effect.setActive(false);
        return;
      }
      const rect = root.getBoundingClientRect();
      const transitioning = root.hasAttribute('data-arriving');
      const ready = near && rect.top <= context.headerOffset() + 1 && rect.bottom > 0 &&
        !transitioning && !document.hidden;
      const visible = near && !document.hidden && (ready || transitioning);
      if (!visible) {
        effect.setActive(false); entrance?.pause();
        if (!near) {
          entrance?.kill(); entrance = null; shown = false;
          gsap.set(bars, { opacity: 0 });
        }
        return;
      }
      if (!ready && !shown && !entrance) { effect.setActive(false); return; }
      effect.setActive(true);
      if (shown) return;
      if (entrance) { entrance.resume(); return; }
      entrance = gsap.to(gsap.utils.shuffle([...bars]), {
        opacity: 1, duration: .3, stagger: { amount: .2 }, ease: 'sine.out',
        onComplete() { shown = true; activate(); },
      });
    }
    const base = app.initChapter(root, { ...context, onChange: render }, { end: 'bottom bottom' });
    const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      near = entries[0].isIntersecting; activate();
    }) : null;
    if (observer) observer.observe(field);
    else near = true;
    root.addEventListener('chapter:transition', activate);
    window.addEventListener('scroll', effect.update, { passive: true });
    window.addEventListener('resize', build);
    document.addEventListener('visibilitychange', activate);
    reduced.addEventListener('change', build);
    context.ScrollTrigger?.addEventListener('refreshInit', build);
    build();
    return {
      setProgress(value, active) { base.setProgress(value, active); },
      destroy() {
        if (destroyed) return;
        destroyed = true; observer?.disconnect(); entrance?.kill();
        root.removeEventListener('chapter:transition', activate);
        window.removeEventListener('scroll', effect.update);
        window.removeEventListener('resize', build);
        document.removeEventListener('visibilitychange', activate);
        reduced.removeEventListener('change', build);
        context.ScrollTrigger?.removeEventListener('refreshInit', build);
        motion?.revert(); effect.destroy(); styles.revert();
        if (previousMode === null) root.removeAttribute('data-motion');
        else root.setAttribute('data-motion', previousMode);
        base.destroy();
      },
    };
  };
})();
