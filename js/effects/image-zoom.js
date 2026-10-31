(() => {
  window.Beyond.effects.createImageZoom = (root, { gsap, from = 1.12, to = 1, clip }) => {
    let timeline;
    const context = gsap.context(() => {
      timeline = gsap.timeline().fromTo(root, { scale: from },
        { scale: to, duration: 1, ease: 'none' });
      if (clip) timeline.fromTo(clip.root, { clipPath: 'inset(0% 0% round 0%)' },
        { clipPath: clip.to, duration: 1, ease: 'power2.inOut' }, 0);
    }, root);
    return { timeline, destroy() { context.revert(); } };
  };
})();
