(() => {
  const app = window.Beyond;
  app.chapters.weight = (root, context) => {
    const intro = root.querySelector('.intro');
    const field = root.querySelector('.field');
    const previousMotion = root.getAttribute('data-motion');
    if (context.gsap && context.ScrollTrigger) root.setAttribute('data-motion', 'scroll');
    else root.removeAttribute('data-motion');
    const effect = app.effects.createProximityType(field);
    const copy = field.querySelector('.copy');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let near = false, destroyed = false, progress = 0, scene, timeline;
    function render(value, active) {
      progress = value;
      timeline?.progress(value);
      activate();
      context.onChange(value, active);
    }
    const base = app.initChapter(root, { ...context, onChange: render }, { start: 'top bottom', end: 'bottom top' });
    function build() {
      scene?.revert(); scene = timeline = null;
      field.style.setProperty('--intro-bottom', intro.offsetTop + intro.offsetHeight + 'px');
      if (context.gsap && context.ScrollTrigger) scene = context.gsap.context(() => {
        const gap = parseFloat(getComputedStyle(copy).fontSize);
        const distance = Math.max(0, copy.offsetHeight - field.clientHeight + gap);
        const height = Math.max(1, innerHeight);
        const reading = reduced.matches ? 4000 : distance > 0 ? 2600 : 0;
        // Timeline durations follow scroll distance, including both chapter boundaries.
        timeline = context.gsap.timeline({ paused: true, onUpdate: effect.update })
          .fromTo(copy, {
            y: reduced.matches ? 0 : height * .12, scale: 1, opacity: 1,
            transformOrigin: '50% ' + (distance + (field.clientHeight - gap) / 2) + 'px',
          }, { y: 0, duration: height, ease: 'none' })
          .to(copy, { y: -distance, duration: reading, ease: 'none' })
          .to(copy, { scale: reduced.matches ? 1 : 2, duration: 4000 - reading + height, ease: 'sine.inOut' });
        timeline.progress(progress);
      }, root);
    }
    function activate() {
      const rect = root.getBoundingClientRect();
      if (!destroyed) effect.setActive(near && rect.top < innerHeight && rect.bottom > 0 && !document.hidden);
    }
    const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      near = entries[0].isIntersecting; activate();
    }) : null;
    if (observer) observer.observe(field);
    else { near = true; activate(); }
    window.addEventListener('resize', build);
    document.addEventListener('visibilitychange', activate);
    reduced.addEventListener('change', build);
    context.ScrollTrigger?.addEventListener('refreshInit', build);
    build();
    return {
      setProgress(value, active) { base.setProgress(value, active); },
      destroy() {
        if (destroyed) return;
        destroyed = true; observer?.disconnect();
        window.removeEventListener('resize', build);
        document.removeEventListener('visibilitychange', activate);
        reduced.removeEventListener('change', build);
        context.ScrollTrigger?.removeEventListener('refreshInit', build);
        scene?.revert(); effect.destroy();
        if (previousMotion === null) root.removeAttribute('data-motion');
        else root.setAttribute('data-motion', previousMotion);
        field.style.removeProperty('--intro-bottom'); base.destroy();
      },
    };
  };
})();
