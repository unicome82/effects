(() => {
  const app = window.Beyond;
  app.chapters.journey = (root, context) => {
    if (!context.gsap || !context.ScrollTrigger) return app.initChapter(root, context);
    const { gsap, ScrollTrigger } = context;
    const stage = root.querySelector('.stage');
    const heading = root.querySelector('.heading');
    const title = heading.querySelector('h2');
    const description = heading.querySelector('.description');
    const words = [...heading.querySelectorAll('.word')];
    const intro = root.querySelector('.intro');
    const viewport = root.querySelector('.viewport');
    const track = root.querySelector('.track');
    const images = [...root.querySelectorAll('img')];
    const desktop = matchMedia('(min-width: 769px)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const previous = ['motion', 'progress', 'active'].map(key => root.getAttribute('data-' + key));
    const previousTravel = root.style.getPropertyValue('--travel');
    let base, trigger, timeline, horizontal, sceneContext;
    let effects = [];
    let destroyed = false;
    let generation = 0;

    function progress(value, active) {
      const p = Math.max(0, Math.min(1, Number(value) || 0));
      root.dataset.progress = p.toFixed(4);
      root.dataset.active = String(active);
      context.onChange(p, active);
    }
    function clear() {
      trigger?.kill();
      timeline?.kill();
      sceneContext?.revert();
      base?.destroy();
      effects.reverse().forEach(effect => effect.destroy());
      effects = [];
      base = trigger = timeline = horizontal = sceneContext = null;
      if (previousTravel) root.style.setProperty('--travel', previousTravel);
      else root.style.removeProperty('--travel');
    }
    function waitForImage(image) {
      if (image.complete) return Promise.resolve();
      return new Promise(resolve => {
        const done = () => {
          image.removeEventListener('load', done);
          image.removeEventListener('error', done);
          pendingImages.delete(done);
          resolve();
        };
        pendingImages.add(done);
        image.addEventListener('load', done);
        image.addEventListener('error', done);
      });
    }
    const pendingImages = new Set();
    async function build() {
      const current = ++generation;
      clear();
      root.dataset.motion = reduced.matches ? 'reduced' : desktop.matches ? 'loading' : 'mobile';
      base = app.initChapter(root, context);
      context.requestRefresh();
      if (!desktop.matches || reduced.matches) {
        if (!reduced.matches) {
          sceneContext = gsap.context(() => {
            gsap.timeline({ scrollTrigger: { trigger: heading, start: 'top 85%', toggleActions: 'play none none reverse' } })
              .fromTo(words, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .5, stagger: .1, ease: 'power2.out' }, 0)
              .fromTo(images[0], { opacity: 0 }, { opacity: .9, duration: .9, ease: 'sine.inOut' }, .6)
              .fromTo(images[0].closest('figure').querySelector('figcaption'), { autoAlpha: 0 },
                { autoAlpha: 1, duration: .4, ease: 'sine.inOut' }, .9);
            images.slice(1).forEach(image => gsap.timeline({
              scrollTrigger: { trigger: image, start: 'center bottom', end: 'center center', scrub: .5 },
            })
              .fromTo(image, { opacity: 0 }, { opacity: .9, duration: 1, ease: 'sine.inOut' }, 0)
              .fromTo(image.closest('figure').querySelector('figcaption'), { autoAlpha: 0 },
                { autoAlpha: 1, duration: 1, ease: 'sine.inOut' }, 0));
          }, root);
        }
        return;
      }
      await Promise.all([...images.map(waitForImage), document.fonts?.ready]);
      if (destroyed || current !== generation) return;
      await new Promise(resolve => requestAnimationFrame(resolve));
      if (destroyed || current !== generation) return;
      clear();
      try {
        root.dataset.motion = 'desktop';
        timeline = gsap.timeline({ paused: true });
        horizontal = app.effects.createHorizontalScroll(viewport, { gsap, track, moveDuration: .84 });
        effects.push(horizontal);
        const opening = 2.7;
        const galleryEnd = opening + horizontal.timeline.duration();
        timeline.add(horizontal.timeline, opening);
        const panels = [...track.children];
        panels.forEach((panel, index) => {
          const parallax = app.effects.createParallax(panel.querySelector('.plane'), { gsap, from: 0, to: -3 });
          const zoom = app.effects.createImageZoom(panel.querySelector('img'), {
            gsap, from: 1.12, to: 1.3,
          });
          effects.push(parallax, zoom);
          timeline.add(parallax.timeline.duration(.5), opening + index * horizontal.step + .18);
          timeline.add(zoom.timeline.duration(.5), opening + index * horizontal.step + .18);
        });
        sceneContext = gsap.context(() => {
          const rem = () => parseFloat(getComputedStyle(root).fontSize);
          const smallTitle = () => Math.max(rem() * 1.125, Math.min(rem() * 1.5, innerWidth * .016));
          const dock = () => intro.offsetTop + rem() * 4;
          timeline.fromTo(words, { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: .3, stagger: .12, ease: 'power2.out' }, .05)
            .fromTo(images[0], { opacity: 0 }, { opacity: .9, duration: .85, ease: 'sine.inOut' }, .62)
            .fromTo(title, {
              left: '50%', top: '43%', x: 0, y: 0, xPercent: -50, yPercent: -50, scale: 1, transformOrigin: '0% 0%',
            }, {
              left: () => intro.offsetLeft, top: dock, xPercent: 0, yPercent: 0,
              scale: () => smallTitle() / parseFloat(getComputedStyle(title).fontSize), duration: .8, ease: 'power2.inOut',
            }, 1.5)
            .fromTo(description, {
              left: '50%', top: '58%', x: 0, y: 0, xPercent: -50, yPercent: -50, scale: 1, transformOrigin: '100% 0%',
            }, {
              left: () => stage.clientWidth - intro.offsetLeft,
              top: () => dock() + Math.max(0, smallTitle() * 1.05 - rem() * .75 * 1.4), xPercent: -100, yPercent: 0,
              scale: () => rem() * .75 / parseFloat(getComputedStyle(description).fontSize), duration: .8, ease: 'power2.inOut',
            }, 1.5)
            .fromTo(root, { '--end': 0 }, { '--end': 1, duration: .9, ease: 'sine.inOut' }, galleryEnd + .2);
          panels.forEach((panel, index) => {
            const start = index ? opening + (index - 1) * horizontal.step + .72 + .84 / 2 + .25 : opening - .3;
            timeline.fromTo(panel.querySelector('figcaption'), { autoAlpha: 0 },
              { autoAlpha: 1, duration: .3, ease: 'sine.inOut' }, start);
          });
          panels.slice(1).forEach((panel, index) => {
            timeline.fromTo(panel.querySelector('img'), { opacity: 0 }, {
              opacity: .9, duration: .6, ease: 'sine.inOut', immediateRender: false,
            }, opening + index * horizontal.step + .72 + .84 / 2);
          });
        }, root);
        let travel = 0;
        function measure() {
          travel = Math.max(innerHeight * panels.length * 1.25, horizontal.distance()) * timeline.duration() / panels.length;
          root.style.setProperty('--travel', travel + 'px');
        }
        measure();
        trigger = ScrollTrigger.create({
          id: 'chapter-' + root.id, trigger: root,
          start: 'top top',
          end: () => '+=' + travel,
          scrub: .6,
          animation: timeline, invalidateOnRefresh: true,
          onRefreshInit: measure,
          onUpdate: self => progress(self.progress, self.isActive),
          onRefresh: self => progress(self.progress, self.isActive),
        });
        ScrollTrigger.sort();
        context.requestRefresh();
      } catch (error) {
        clear();
        root.dataset.motion = 'fallback';
        base = app.initChapter(root, context);
        context.requestRefresh();
        console.warn('Journey: static gallery', error);
      }
    }
    desktop.addEventListener('change', build);
    reduced.addEventListener('change', build);
    build();
    return {
      setProgress(value, active = value > 0 && value < 1) {
        if (destroyed) return;
        if (base) base.setProgress(value, active);
        else { timeline?.progress(value); progress(value, active); }
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        generation++;
        desktop.removeEventListener('change', build);
        reduced.removeEventListener('change', build);
        [...pendingImages].forEach(done => done());
        clear();
        ['motion', 'progress', 'active'].forEach((key, index) => {
          if (previous[index] === null) root.removeAttribute('data-' + key);
          else root.setAttribute('data-' + key, previous[index]);
        });
      },
    };
  };
})();
