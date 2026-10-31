(() => {
  window.Beyond.effects.createParallax = (root, { gsap, from = 5, to = -5 }) => {
    let timeline;
    const context = gsap.context(() => {
      timeline = gsap.timeline().fromTo(root, { xPercent: from },
        { xPercent: to, duration: 1, ease: 'none' });
    }, root);
    return { timeline, destroy() { context.revert(); } };
  };
})();
