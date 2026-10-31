(() => {
  // Fixed bold-width cells prevent layout shifts; liveBounds follows rotated letters.
  window.Beyond.effects.createProximityType = (root, { radius = 1.1, minWeight = 200, maxWeight = 900, delay = .08, response = .24, copy = root.querySelector('.copy'), targets, liveBounds = false, baseWeight = () => minWeight } = {}) => {
    const original = targets ? null : root.innerHTML;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const elements = targets ? [...targets] : [];
    const styles = targets ? elements.map(element => element.getAttribute('style')) : null;
    if (!targets) {
      const content = document.createDocumentFragment();
      [...copy.textContent].forEach(character => {
        if (/\s/.test(character)) { content.append(document.createTextNode(' ')); return; }
        const element = document.createElement('span');
        element.className = 'letter'; element.textContent = character;
        elements.push(element); content.append(element);
      });
      copy.replaceChildren(content);
    }
    const letters = elements.map(element => ({ element, weight: minWeight, applied: minWeight, left: 0, top: 0, width: 0, height: 0 }));
    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let enabled = false, present = false, destroyed = false, frame = 0, last = 0, timer = 0, pending = 0, size = 0, width = 1;
    function measure() {
      letters.forEach(({ element }) => {
        element.style.width = '';
        element.style.fontVariationSettings = '"wght" ' + maxWeight;
      });
      const zoom = copy.getBoundingClientRect().width / (copy.offsetWidth || 1) || 1;
      const widths = letters.map(({ element }) => liveBounds
        ? parseFloat(getComputedStyle(element).width) || element.offsetWidth
        : element.getBoundingClientRect().width / zoom);
      letters.forEach((record, index) => {
        record.element.style.width = widths[index] + 'px';
        record.weight = minWeight; record.applied = Math.round(baseWeight(index));
        record.element.style.fontVariationSettings = '"wght" ' + record.applied;
      });
      size = parseFloat(getComputedStyle(copy).fontSize);
      width = copy.offsetWidth || 1;
      const bounds = copy.getBoundingClientRect();
      const scale = bounds.width / width || 1;
      if (!liveBounds) letters.forEach(record => {
        const rect = record.element.getBoundingClientRect();
        record.left = (rect.left - bounds.left) / scale; record.top = (rect.top - bounds.top) / scale;
        record.width = rect.width / scale; record.height = rect.height / scale;
      });
      schedule();
    }
    function schedule() {
      if (enabled && !destroyed && !reduced.matches && !document.hidden && !frame) frame = requestAnimationFrame(render);
    }
    function render(now) {
      frame = 0;
      const blend = 1 - Math.exp(-Math.min((now - (last || now - 16)) / 1000, .08) / response);
      last = now;
      const bounds = copy.getBoundingClientRect();
      const scale = bounds.width / width || 1;
      const writes = [];
      let moving = false;
      letters.forEach((record, index) => {
        const rect = liveBounds ? record.element.getBoundingClientRect() : null;
        const left = rect ? rect.left : bounds.left + record.left * scale;
        const top = rect ? rect.top : bounds.top + record.top * scale;
        const dx = Math.max(left - pointer.x, 0, pointer.x - left - (rect ? rect.width : record.width * scale));
        const dy = Math.max(top - pointer.y, 0, pointer.y - top - (rect ? rect.height : record.height * scale));
        const near = present ? Math.max(0, 1 - Math.hypot(dx, dy) / Math.max(1, size * scale * radius)) : 0;
        const target = minWeight + (maxWeight - minWeight) * near * near * (3 - 2 * near);
        record.weight += (target - record.weight) * blend;
        if (Math.abs(target - record.weight) < .5) record.weight = target;
        else moving = true;
        const weight = Math.round(Math.max(record.weight, baseWeight(index)));
        if (weight !== record.applied) { writes.push([record.element, weight]); record.applied = weight; }
      });
      writes.forEach(([element, weight]) => { element.style.fontVariationSettings = '"wght" ' + weight; });
      if (moving) schedule(); else last = 0;
    }
    function move(event) {
      if (!enabled || destroyed || reduced.matches) return;
      clearTimeout(timer);
      target.x = event.clientX; target.y = event.clientY;
      if (!pending) pending = setTimeout(() => {
        pending = 0; present = true;
        pointer.x = target.x; pointer.y = target.y;
        schedule();
      }, delay * 1000);
    }
    function reset() { clearTimeout(timer); clearTimeout(pending); pending = 0; present = false; schedule(); }
    function release(event) { if (event.pointerType !== 'mouse') timer = setTimeout(reset, 450); }
    function update() {
      reset(); cancelAnimationFrame(frame); frame = last = 0;
      letters.forEach((record, index) => {
        record.weight = minWeight; record.applied = Math.round(baseWeight(index));
        record.element.style.fontVariationSettings = '"wght" ' + record.applied;
      });
    }
    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerdown', move, { passive: true });
    root.addEventListener('pointerleave', reset);
    root.addEventListener('pointercancel', reset);
    root.addEventListener('pointerup', release);
    window.addEventListener('blur', reset);
    window.addEventListener('resize', measure, { passive: true });
    document.fonts?.addEventListener('loadingdone', measure);
    reduced.addEventListener('change', update);
    measure();
    return {
      measure,
      update: schedule,
      setActive(value) { if (!destroyed) { enabled = Boolean(value); if (!enabled) update(); else schedule(); } },
      destroy() {
        if (destroyed) return;
        destroyed = true; clearTimeout(timer); clearTimeout(pending); cancelAnimationFrame(frame);
        root.removeEventListener('pointermove', move);
        root.removeEventListener('pointerdown', move);
        root.removeEventListener('pointerleave', reset);
        root.removeEventListener('pointercancel', reset);
        root.removeEventListener('pointerup', release);
        window.removeEventListener('blur', reset);
        window.removeEventListener('resize', measure);
        document.fonts?.removeEventListener('loadingdone', measure);
        reduced.removeEventListener('change', update);
        if (styles) elements.forEach((element, index) => {
          if (styles[index] === null) element.removeAttribute('style');
          else element.setAttribute('style', styles[index]);
        });
        else root.innerHTML = original;
      },
    };
  };
})();
