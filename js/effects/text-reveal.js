(() => {
  const effects = window.Beyond.effects;
  /** Accessible text stays outside root; this aria-hidden visual layer is split.
   * options: gsap, distance=64, stagger=.025. Returns glyphs, setProgress, destroy.
   */
  effects.createTextReveal = (root, { gsap, distance = 64, stagger = .025, startOpacity = .14 }) => {
    const original = root.innerHTML;
    let context;
    let timeline;
    let destroyed = false;
    try {
      root.querySelectorAll('[data-line]').forEach(line => {
        const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(node => {
          const fragment = document.createDocumentFragment();
          Array.from(node.textContent).forEach(character => {
            const glyph = document.createElement('span');
            glyph.className = 'glyph';
            const face = document.createElement('span');
            face.className = 'face';
            face.textContent = character === ' ' ? '\u00a0' : character;
            glyph.append(face);
            fragment.append(glyph);
          });
          node.replaceWith(fragment);
        });
      });
      const glyphs = [...root.querySelectorAll('.glyph, [data-reveal]')];
      context = gsap.context(() => {
        timeline = gsap.timeline({ paused: true }).fromTo(glyphs,
          { y: distance, opacity: startOpacity },
          { y: 0, opacity: 1, duration: .6, stagger, ease: 'power3.out' });
      }, root);
      return {
        glyphs,
        play(onComplete) { if (!destroyed) timeline.eventCallback('onComplete', onComplete).play(); },
        pause() { if (!destroyed) timeline.pause(); },
        setProgress(value) {
          if (!destroyed) timeline.progress(Math.max(0, Math.min(1, value)));
        },
        destroy() {
          if (destroyed) return;
          destroyed = true;
          context.revert();
          root.innerHTML = original;
        },
      };
    } catch (error) {
      context?.revert();
      root.innerHTML = original;
      throw error;
    }
  };
})();
