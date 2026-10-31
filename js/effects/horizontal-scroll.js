(() => {
  window.Beyond.effects.createHorizontalScroll = (root, { gsap, track, moveDuration = .28 }) => {
    let timeline;
    const panels = [...track.children];
    const step = .72 + moveDuration;
    const distance = () => Math.max(0, panels.length - 1) * root.clientWidth;
    const context = gsap.context(() => {
      gsap.set(track, { x: 0 });
      timeline = gsap.timeline();
      panels.slice(1).forEach((_, index) => {
        timeline.fromTo(track, {
          x: () => -root.clientWidth * index,
        }, {
          x: () => -root.clientWidth * (index + 1),
          duration: moveDuration, ease: 'power2.inOut', immediateRender: false,
        }, index * step + .72);
      });
      timeline.set(track, { x: () => -distance() }, Math.max(0, panels.length - 1) * step + 1);
    }, root);
    return { timeline, distance, step, destroy() { context.revert(); } };
  };
})();
