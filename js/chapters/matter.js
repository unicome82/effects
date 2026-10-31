(() => {
  const app = window.Beyond;
  app.chapters.matter = (root, context) => {
    if (!context.gsap || !context.ScrollTrigger) return app.initChapter(root, context);
    const { gsap } = context;
    const stage = root.querySelector('.stage');
    const images = [...root.querySelectorAll('.slides .image')];
    const title = root.querySelector('h2');
    const words = [...title.querySelectorAll('.word')];
    const control = root.querySelector('.switch');
    const displacement = root.querySelector('feDisplacementMap');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = matchMedia('(min-width: 769px) and (hover: hover) and (pointer: fine)');
    const keys = ['motion', 'render', 'pointer'];
    const previous = keys.map(key => root.getAttribute('data-' + key));
    const previousTravel = root.style.getPropertyValue('--travel');
    const previousLabel = control.getAttribute('aria-label');
    const previousHidden = images.map(image => image.getAttribute('aria-hidden'));
    const travel = 3400;
    let base, sceneContext, transition, imageTween;
    let mode, selected = 0, progress = 0, departure = 0;
    let frame = 0, timer = 0, cursorFrame = 0, last = 0, time = 0, maxScale = 0;
    let near = false, visible = false, destroyed = false;
    const pointer = { strength: 0, current: 0 };
    const cursor = { x: 0, y: 0 };
    const clamp = value => Math.max(0, Math.min(1, value));

    function measure() {
      // Keep sampling inside the image's existing 7% overscan.
      maxScale = Math.min(72, stage.clientWidth * .065, stage.clientHeight * .065);
    }
    function queue(delay = 0) {
      if (frame || timer) return;
      if (delay > 0) timer = setTimeout(() => { timer = 0; frame = requestAnimationFrame(render); }, delay);
      else frame = requestAnimationFrame(render);
    }

    function dock() {
      cancelAnimationFrame(cursorFrame); cursorFrame = 0;
      if (root.hasAttribute('data-pointer')) root.removeAttribute('data-pointer');
      control.style.removeProperty('transform');
    }
    function positionCursor() {
      cursorFrame = 0;
      if (mode !== 'desktop' || control.disabled || root.hasAttribute('data-arriving')) { dock(); return; }
      const rect = stage.getBoundingClientRect();
      control.style.transform = 'translate3d(' + (cursor.x - rect.left) + 'px,' + (cursor.y - rect.top) + 'px,0) translate(-50%,-50%)';
      if (root.dataset.pointer !== 'on') root.dataset.pointer = 'on';
    }
    function stop() {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      timer = 0;
      frame = last = 0;
      pointer.strength = pointer.current = 0;
      if (displacement.getAttribute('scale') !== '0') displacement.setAttribute('scale', '0');
      if (root.dataset.render !== 'off') root.dataset.render = 'off';
    }
    function available() { return mode === 'desktop' && (near && visible || root.hasAttribute('data-arriving')) && !document.hidden && progress < 1; }
    function syncRender() { if (!available()) stop(); }
    function render(now) {
      frame = 0;
      if (destroyed || !available()) { stop(); return; }
      if (last && now - last < 42) { queue(42 - (now - last)); return; }
      const delta = last ? Math.min((now - last) / 1000, .2) : 1 / 60;
      last = now;
      time += delta;
      const response = pointer.strength > pointer.current ? .22 : .55;
      pointer.current += (pointer.strength - pointer.current) * (1 - Math.exp(-delta / response));
      pointer.strength *= Math.exp(-delta / .45);
      if (pointer.strength < .004 && pointer.current < .004) { stop(); return; }
      displacement.setAttribute('scale', (maxScale * (.85 + Math.sin(time * .65) * .15) * pointer.current * (1 - departure)).toFixed(2));
      queue(42);
    }
    function label() {
      images.forEach((image, index) => image.setAttribute('aria-hidden', String(index !== selected)));
      control.setAttribute('aria-label', '다음 배경 이미지, 현재 ' + (selected + 1) + '/' + images.length);
    }
    function finishImage() {
      if (!imageTween) return;
      imageTween.kill();
      imageTween = null;
      gsap.set(images, { opacity: index => index === selected ? 1 : 0, zIndex: 0, clipPath: 'none' });
    }
    function next(event) {
      if (control.disabled || imageTween || root.hasAttribute('data-arriving') || event.button > 0) return;
      if (!control.contains(event.target) && window.getSelection()?.toString()) return;
      selected = (selected + 1) % images.length;
      label();
      if (reduced.matches) {
        gsap.set(images, { opacity: index => index === selected ? 1 : 0 });
        return;
      }
      const image = images[selected];
      const rect = image.getBoundingClientRect();
      const button = control.getBoundingClientRect();
      const width = image.clientWidth, height = image.clientHeight;
      // Map the click into the scaled image's local coordinates.
      const x = (event.detail ? event.clientX : button.left + button.width / 2) - rect.left;
      const y = (event.detail ? event.clientY : button.top + button.height / 2) - rect.top;
      const cx = Math.max(0, Math.min(width, x * width / Math.max(1, rect.width)));
      const cy = Math.max(0, Math.min(height, y * height / Math.max(1, rect.height)));
      const radius = Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy)) + 2;
      const center = ' at ' + cx + 'px ' + cy + 'px)';
      imageTween = gsap.fromTo(image, {
        opacity: 1, zIndex: 1, clipPath: 'circle(0px' + center,
      }, {
        clipPath: 'circle(' + radius + 'px' + center,
        duration: mode === 'mobile' ? .75 : 1, ease: 'power2.inOut', onComplete: finishImage,
      });
    }
    function onProgress(value, active) {
      progress = value;
      departure = mode === 'reduced' ? 0 : clamp((value - .8) / .2);
      transition?.progress(departure);
      control.disabled = departure > .8;
      if (control.disabled) dock();
      context.onChange(value, active);
      syncRender();
    }
    function clear() {
      stop();
      imageTween?.kill();
      base?.destroy();
      sceneContext?.revert();
      base = sceneContext = transition = imageTween = null;
      if (previousTravel) root.style.setProperty('--travel', previousTravel);
      else root.style.removeProperty('--travel');
      control.disabled = true;
      dock();
    }
    function build() {
      if (destroyed) return;
      clear();
      mode = reduced.matches ? 'reduced' : desktop.matches ? 'desktop' : 'mobile';
      root.dataset.motion = mode;
      measure();
      if (mode !== 'reduced') root.style.setProperty('--travel', travel + 'px');
      sceneContext = gsap.context(() => {
        gsap.set(images, { opacity: index => index === selected ? 1 : 0, zIndex: 0, clipPath: 'none' });
        if (mode !== 'reduced') {
          gsap.fromTo(words, { opacity: 0, y: 20 }, {
            opacity: 1, y: 0, duration: .5, stagger: .12, ease: 'power2.out',
            scrollTrigger: { trigger: root, start: 'top 25%', toggleActions: 'play none none reverse' },
          });
          gsap.fromTo(title, { scale: 1, letterSpacing: '0em', fontWeight: 600, transformOrigin: '50% 50%' }, {
            scale: mode === 'mobile' ? 3 : 4, letterSpacing: '-.2em', fontWeight: 200, duration: 1, ease: 'none',
            scrollTrigger: { trigger: root, start: 'top -500px', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
          });
          transition = gsap.timeline({ paused: true })
            .fromTo(stage, { autoAlpha: 1 }, { autoAlpha: 0, duration: 1, ease: 'sine.inOut' });
        }
      }, root);
      label();
      base = app.initChapter(root, { ...context, onChange: onProgress }, {
        end: mode === 'reduced' ? undefined : () => '+=' + travel,
      });
      context.requestRefresh();
      syncRender();
    }
    function onPointer(event) {
      if (mode !== 'desktop' || event.pointerType !== 'mouse') return;
      if (available()) {
        pointer.strength = 1;
        if (root.dataset.render !== 'on') root.dataset.render = 'on';
        queue();
      }
      if (control.disabled || root.hasAttribute('data-arriving')) { dock(); return; }
      cursor.x = event.clientX; cursor.y = event.clientY;
      if (!cursorFrame) cursorFrame = requestAnimationFrame(positionCursor);
    }
    function reset() { pointer.strength = 0; dock(); }
    function onResize() { finishImage(); measure(); }
    function onFocus() { if (control.matches(':focus-visible')) dock(); }
    function onVisibility() { if (document.hidden) { reset(); finishImage(); } syncRender(); }
    const proximity = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      near = entries[0].isIntersecting;
      syncRender();
    }, { rootMargin: '300px 0px' }) : null;
    const visibility = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (!visible) { reset(); finishImage(); }
      syncRender();
    }) : null;
    build();
    proximity?.observe(root);
    visibility?.observe(root);
    if (!proximity) { near = visible = true; syncRender(); }
    stage.addEventListener('pointermove', onPointer, { passive: true });
    stage.addEventListener('pointerleave', reset);
    stage.addEventListener('click', next);
    control.addEventListener('focus', onFocus);
    reduced.addEventListener('change', build);
    desktop.addEventListener('change', build);
    document.addEventListener('visibilitychange', onVisibility);
    root.addEventListener('chapter:handoff', syncRender);
    window.addEventListener('resize', onResize);
    context.ScrollTrigger.addEventListener('refresh', measure);
    return {
      setProgress(value, active) { if (!destroyed) base?.setProgress(value, active); },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        proximity?.disconnect();
        visibility?.disconnect();
        stage.removeEventListener('pointermove', onPointer);
        stage.removeEventListener('pointerleave', reset);
        stage.removeEventListener('click', next);
        control.removeEventListener('focus', onFocus);
        reduced.removeEventListener('change', build);
        desktop.removeEventListener('change', build);
        document.removeEventListener('visibilitychange', onVisibility);
        root.removeEventListener('chapter:handoff', syncRender);
        window.removeEventListener('resize', onResize);
        context.ScrollTrigger.removeEventListener('refresh', measure);
        clear();
        control.setAttribute('aria-label', previousLabel);
        images.forEach((image, index) => {
          if (previousHidden[index] === null) image.removeAttribute('aria-hidden');
          else image.setAttribute('aria-hidden', previousHidden[index]);
        });
        keys.forEach((key, index) => {
          if (previous[index] === null) root.removeAttribute('data-' + key);
          else root.setAttribute('data-' + key, previous[index]);
        });
      },
    };
  };
})();
