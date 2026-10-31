(() => {
  const app = window.Beyond;
  app.createTransitions = (roots, { gsap, ScrollTrigger, headerOffset }) => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const header = document.querySelector('.site-header');
    const footer = document.querySelector('.site-footer');
    const scenes = footer ? [...roots, footer] : roots;
    const previousTone = header.getAttribute('data-tone');
    const layer = document.createElement('div');
    layer.className = 'handoff';
    layer.setAttribute('aria-hidden', 'true');
    layer.hidden = true;
    document.body.append(layer);
    let dot = null, dotSlot = null, dotStyle = null, dotBox = null;
    let current = -1, frame = 0, destroyed = false;
    let pending = location.hash;
    let alignFrame = 0;
    const clamp = value => Math.max(0, Math.min(1, value));
    const ease = value => value * value * (3 - 2 * value);
    const mix = (a, b, p) => a + (b - a) * p;
    function pinStages() {
      scenes.forEach((root, index) => {
        const rect = root.getBoundingClientRect(), mode = root.dataset.motion;
        const enabled = root === footer || root.dataset.view === '3d' || mode === 'scroll' ||
          (root.id === 'awakening' || root.id === 'matter') && (mode === 'desktop' || mode === 'mobile') ||
          root.id === 'journey' && mode === 'desktop';
        // Magnetic exits and Weight enters in normal flow across their gap.
        const incoming = index > 0 && current === index - 1 && scenes[current]?.id !== 'magnetic';
        const outgoing = current === index && root.id !== 'magnetic';
        // Keep these completed frames fixed until the next screen covers them.
        const bottom = ['awakening', 'dimension', 'weight'].includes(root.id) ? -innerHeight : 0;
        const visible = root.id === 'magnetic' ? incoming : incoming || outgoing || rect.top <= 1 && rect.bottom > bottom;
        root.toggleAttribute('data-pinned', Boolean(!destroyed && gsap && !reduced.matches && enabled && visible));
      });
    }
    function paintHeader() {
      const end = footer?.getBoundingClientRect();
      document.body.classList.toggle('is-outro', !!end && end.top < innerHeight && end.bottom > 0);
      const x = innerWidth / 2, y = header.offsetHeight / 2;
      const covers = rect => rect.top <= y && rect.bottom > y && rect.left <= x && rect.right > x;
      let tone = 'light';
      scenes.forEach(root => {
        if (root.hasAttribute('data-arriving') && Number(root.style.getPropertyValue('--arrive')) < .5) return;
        if (!covers(root.querySelector('.stage').getBoundingClientRect())) return;
        tone = root.dataset.header || 'light';
      });
      if (scenes[current]?.id === 'magnetic' && Number(scenes[current + 1].style.getPropertyValue('--arrive')) >= .5) tone = scenes[current + 1].dataset.header || 'light';
      if (current === 0 && dot && covers(dot.getBoundingClientRect())) tone = roots[1].dataset.header || 'light';
      if (header.dataset.tone !== tone) header.dataset.tone = tone;
    }
    function clear() {
      if (dot) {
        if (dotStyle === null) dot.removeAttribute('style'); else dot.setAttribute('style', dotStyle);
        dot.classList.remove('live-dot');
        if (dotSlot?.isConnected) dotSlot.replaceWith(dot); else dot.remove();
        dot = dotSlot = dotBox = null;
      }
      if (current >= 0) {
        if (current === 1) roots[1].dispatchEvent(new CustomEvent('chapter:exit', { detail: 0 }));
        scenes[current].removeAttribute('data-departing');
        scenes[current].style.removeProperty('--depart');
        scenes[current + 1].removeAttribute('data-arriving');
        scenes[current + 1].removeAttribute('data-background');
        scenes[current + 1].style.removeProperty('--arrive');
        scenes[current].dispatchEvent(new Event('chapter:transition'));
        scenes[current + 1].dispatchEvent(new Event('chapter:transition'));
        if (current === 2) {
          roots[3].style.removeProperty('--surface');
          roots[3].dispatchEvent(new Event('chapter:handoff'));
        }
      }
      current = -1;
      layer.hidden = true;
      layer.removeAttribute('style');
      pinStages();
    }
    function begin(index) {
      clear(); current = index;
      pinStages();
      if (scenes[index].id === 'magnetic') { scenes[index + 1].setAttribute('data-background', ''); return; }
      layer.hidden = index === 2 || index >= 4; layer.dataset.kind = ['dot', 'fade', 'metal', 'gallery'][index] || 'fade';
      scenes[index].setAttribute('data-departing', '');
      scenes[index + 1].setAttribute('data-arriving', '');
      scenes[index].dispatchEvent(new Event('chapter:transition'));
      scenes[index + 1].dispatchEvent(new Event('chapter:transition'));
      if (index === 2) roots[3].dispatchEvent(new Event('chapter:handoff'));
      if (index === 0) {
        dot = roots[0].querySelector('.accent');
        const rect = dot.getBoundingClientRect();
        const stage = roots[0].querySelector('.stage').getBoundingClientRect();
        const style = getComputedStyle(dot);
        dotStyle = dot.getAttribute('style');
        dotBox = { x: rect.left, y: rect.top - stage.top, width: rect.width, height: rect.height };
        const fill = style.backgroundColor;
        dotSlot = document.createElement('span');
        dotSlot.style.cssText = 'display:inline-block;width:' + rect.width + 'px;height:' + rect.height + 'px';
        dotSlot.setAttribute('aria-hidden', 'true');
        dot.replaceWith(dotSlot);
        layer.append(dot);
        dot.classList.add('live-dot');
        gsap.set(dot, { backgroundColor: fill, margin: 0, left: dotBox.x, top: dotBox.y, width: dotBox.width, height: dotBox.height, transformOrigin: '50% 50%' });
      }
    }
    function paint() {
      frame = 0;
      if (destroyed) return;
      if (!gsap || reduced.matches) { clear(); paintHeader(); return; }
      const top = headerOffset(), height = Math.max(1, innerHeight - top);
      let index = -1, p = 0;
      for (let i = 0; i < scenes.length - 1; i++) {
        const distance = scenes[i + 1].getBoundingClientRect().top - top;
        if (distance > 1 && distance < height) { index = i; p = clamp(1 - distance / height); break; }
      }
      // Reuse Matter's selected, distorted image for Typography's final reveal.
      const opacity = roots[2].dataset.motion === 'scroll' ? Number(roots[2].style.getPropertyValue('--reveal')) : 0;
      if (index < 0 && opacity > 0 && roots[2].getBoundingClientRect().top <= top &&
          roots[3].getBoundingClientRect().top - top >= height) index = 2;
      if (index === 2 && roots[2].dataset.motion !== 'scroll') index = -1;
      if (index === 3 && roots[4].dataset.motion !== 'desktop') index = -1;
      if (index < 0) { clear(); paintHeader(); return; }
      if (current !== index) begin(index);
      pinStages();
      gsap.set(layer, { top, height });
      scenes[index + 1].style.setProperty('--arrive', String(ease(p)));
      if (index === 0) {
        const cx = dotBox.x + dotBox.width / 2, cy = dotBox.y + dotBox.height / 2;
        const cover = Math.max((2 * Math.max(cx, layer.clientWidth - cx) + 4) / dotBox.width,
          (2 * Math.max(cy, height - cy) + 4) / dotBox.height);
        gsap.set(layer, { zIndex: 2, backgroundColor: getComputedStyle(roots[0]).backgroundColor, opacity: 1 });
        gsap.set(dot, { scale: mix(1, cover, ease(clamp(p / .75))), opacity: 1 });
        roots[1].style.setProperty('--arrive', String(ease(clamp((p - .75) / .25))));
      } else if (index === 1) {
        roots[1].dispatchEvent(new CustomEvent('chapter:exit', { detail: p }));
        roots[1].style.setProperty('--depart', String(ease(p)));
        gsap.set(layer, { opacity: 0 });
      } else if (index === 2) {
        roots[3].style.setProperty('--surface', String(opacity));
        roots[3].style.setProperty('--arrive', String(ease(clamp((p - .15) / .85))));
      } else if (index === 3) {
        gsap.set(layer, { backgroundColor: '#101010', opacity: 1 });
      } else if (scenes[index].id !== 'magnetic') {
        scenes[index].style.setProperty('--depart', String(ease(p)));
      }
      paintHeader();
    }
    function schedule() { if (!destroyed && !frame) frame = requestAnimationFrame(paint); }
    function resize() { clear(); schedule(); }
    function targetFor(hash) { try { return roots.find(root => root.id === decodeURIComponent(hash.slice(1))); } catch { return null; } }
    function align() {
      cancelAnimationFrame(alignFrame);
      const target = targetFor(pending);
      if (target) alignFrame = requestAnimationFrame(() => {
        if (!destroyed && pending) window.scrollTo(0, target.getBoundingClientRect().top + scrollY - headerOffset());
      });
      schedule();
    }
    function intent() { pending = ''; cancelAnimationFrame(alignFrame); }
    function hash() { pending = location.hash; align(); }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', resize);
    window.addEventListener('hashchange', hash);
    document.addEventListener('wheel', intent, { passive: true });
    document.addEventListener('pointerdown', intent, { passive: true });
    document.addEventListener('keydown', intent);
    reduced.addEventListener('change', schedule);
    ScrollTrigger?.addEventListener('refresh', align);
    align(); schedule();
    return {
      update() { if (!destroyed) { cancelAnimationFrame(frame); paint(); } },
      destroy() {
        if (destroyed) return;
        destroyed = true; clear(); cancelAnimationFrame(frame); cancelAnimationFrame(alignFrame);
        window.removeEventListener('scroll', schedule); window.removeEventListener('resize', resize); window.removeEventListener('hashchange', hash);
        document.removeEventListener('wheel', intent); document.removeEventListener('pointerdown', intent); document.removeEventListener('keydown', intent);
        reduced.removeEventListener('change', schedule); ScrollTrigger?.removeEventListener('refresh', align);
        layer.remove();
        document.body.classList.remove('is-outro');
        if (previousTone === null) header.removeAttribute('data-tone'); else header.setAttribute('data-tone', previousTone);
      },
    };
  };
})();
