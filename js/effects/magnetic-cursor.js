(() => {
  const effects = window.Beyond.effects = window.Beyond.effects || {};
  // One field owns the pointer listeners; each line owns its transform.
  effects.createMagneticCursor = (root, { gsap, ScrollTrigger, maxOffset = 72, delay = .12, duration = .9 } = {}) => {
    if (!gsap) return { setActive() {}, destroy() {} };
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const bars = [...root.querySelectorAll('.bar')];
    const pointer = { x: 0, y: 0 };
    let enabled = false, present = false, destroyed = false, dirty = true, context, pending, items = [];
    function measure() {
      items.forEach(item => {
        const bar = item.bar;
        item.parent = bar.offsetParent || root;
        item.halfWidth = bar.offsetWidth / 2; item.halfHeight = bar.offsetHeight / 2;
        item.centerX = bar.offsetLeft + item.halfWidth; item.centerY = bar.offsetTop + item.halfHeight;
      });
      dirty = false;
    }
    function write(item, values) {
      values.forEach((value, index) => {
        if (value !== item.target[index] && (value === 0 || Math.abs(value - item.target[index]) > .1)) {
          item.target[index] = value; item.setters[index](value);
        }
      });
    }
    function apply() {
      pending = null;
      if (dirty) measure();
      const rect = root.getBoundingClientRect();
      const radius = Math.max(100, Math.min(rect.width * .3, rect.height * .65));
      const limit = Math.min(maxOffset, rect.width * .15);
      const origins = new Map();
      // Read every moving row before any quickTo call can change styles.
      items.forEach(({ parent }) => { if (!origins.has(parent)) origins.set(parent, parent.getBoundingClientRect()); });
      const targets = items.map((item, index) => {
        const origin = origins.get(item.parent);
        const dx = origin.left + item.centerX - pointer.x;
        const dy = origin.top + item.centerY - pointer.y;
        const edge = Math.hypot(Math.max(Math.abs(dx) - item.halfWidth, 0), Math.max(Math.abs(dy) - item.halfHeight, 0));
        const force = Math.max(0, 1 - edge / radius) ** 2;
        if (!force) return [0, 0, 0];
        const angle = Math.atan2(dy, dx);
        const spread = angle + Math.sin(index * 2.4) * .45;
        const travel = force * limit * (1.6 + (Math.sin(index * 1.7) + 1) * .6);
        const turn = ((angle * 180 / Math.PI) % 180 + 180) % 180 - 90;
        return [Math.cos(spread) * travel, Math.sin(spread) * travel,
          (turn * .65 + Math.sin(index * 2.4 + .7) * 40) * force];
      });
      items.forEach((item, index) => write(item, targets[index]));
    }
    function schedule() { if (present && context && !pending) pending = gsap.delayedCall(delay, apply); }
    function move(event) {
      present = true;
      pointer.x = event.clientX; pointer.y = event.clientY;
      schedule();
    }
    function reset() {
      pending?.kill(); pending = null;
      present = false;
      items.forEach(item => write(item, [0, 0, 0]));
    }
    function resize() { dirty = true; reset(); }
    function refresh() { dirty = true; schedule(); }
    function detach() {
      reset();
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerdown', move);
      root.removeEventListener('pointerleave', reset);
      root.removeEventListener('pointerup', reset);
      root.removeEventListener('pointercancel', reset);
      context?.revert(); context = null; items = []; dirty = true;
    }
    function update() {
      if (!enabled || destroyed || reduced.matches) { detach(); return; }
      if (context) return;
      const tilts = bars.map(bar => parseFloat(getComputedStyle(bar).getPropertyValue('--angle')) || 0);
      context = gsap.context(() => {
        items = bars.map((bar, index) => {
          const rotate = gsap.quickTo(bar, 'rotation', { duration, ease: 'sine.out' });
          return { bar, target: [0, 0, 0], setters: [
            gsap.quickTo(bar, 'x', { duration, ease: 'sine.out' }),
            gsap.quickTo(bar, 'y', { duration, ease: 'sine.out' }),
            value => rotate(tilts[index] + value),
          ] };
        });
      }, root);
      root.addEventListener('pointermove', move, { passive: true });
      root.addEventListener('pointerdown', move, { passive: true });
      root.addEventListener('pointerleave', reset);
      root.addEventListener('pointerup', reset);
      root.addEventListener('pointercancel', reset);
    }
    reduced.addEventListener('change', update);
    window.addEventListener('resize', resize);
    window.addEventListener('blur', reset);
    ScrollTrigger?.addEventListener('refresh', refresh);
    return {
      update: schedule,
      setActive(value) { if (!destroyed && enabled !== Boolean(value)) { enabled = Boolean(value); update(); } },
      destroy() {
        if (destroyed) return;
        destroyed = true; detach();
        reduced.removeEventListener('change', update);
        window.removeEventListener('resize', resize);
        window.removeEventListener('blur', reset);
        ScrollTrigger?.removeEventListener('refresh', refresh);
      },
    };
  };
})();
