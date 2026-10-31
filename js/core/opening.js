(() => {
  window.Beyond.createOpening = () => {
    const root = document.querySelector('.opening');
    if (!root) return null;
    const url = new URL(location.href);
    const restart = url.searchParams.get('intro') === '1';
    if (restart) {
      url.searchParams.delete('intro'); url.hash = '';
      try { history.scrollRestoration = 'manual'; history.replaceState(null, '', url.href); } catch { /* Keep the restart URL if history is restricted. */ }
      window.scrollTo(0, 0);
    }
    if (!restart && (location.hash || window.scrollY > 1)) { root.remove(); return null; }
    const copy = root.querySelector('p');
    const button = root.querySelector('.skip');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const content = document.createDocumentFragment();
    [...copy.textContent].forEach((character, index) => {
      const letter = document.createElement('span');
      letter.className = 'letter'; letter.textContent = character;
      letter.style.setProperty('--i', index);
      const angle = index * 2.4;
      letter.style.setProperty('--x', (Math.cos(angle) * 130).toFixed(2) + 'vmax');
      letter.style.setProperty('--y', (Math.sin(angle) * 130).toFixed(2) + 'vmax');
      letter.style.setProperty('--rotate', (index % 2 ? 1 : -1) * (14 + index % 5 * 7) + 'deg');
      content.append(letter);
    });
    copy.replaceChildren(content);
    const last = copy.lastElementChild;
    const boldTimers = [];
    let closed = false, closing = false, timer;
    const position = window.scrollY;
    function block(event) { event.preventDefault(); }
    function lock() { if (window.scrollY !== position) window.scrollTo(0, position); }
    function clearTimers() {
      clearTimeout(timer);
      boldTimers.forEach(id => clearTimeout(id)); boldTimers.length = 0;
    }
    function hold() {
      root.classList.add('is-holding'); clearTimers();
      const letters = [...copy.children].filter(letter => letter.textContent.trim());
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
      let remaining = letters.length;
      letters.forEach((letter, index) => {
        const p = index / Math.max(1, letters.length - 1);
        boldTimers.push(setTimeout(() => {
          letter.style.fontWeight = '900';
          if (--remaining === 0) timer = setTimeout(leave, 3000);
        }, 200 + 3000 * (1 - (1 - p) ** 2)));
      });
      if (!remaining) timer = setTimeout(leave, 3000);
    }
    function leave() {
      if (closed || closing) return;
      closing = true; clearTimers();
      root.classList.add('is-leaving');
      timer = setTimeout(finish, reduced.matches ? 650 : 1500);
    }
    function skip() {
      if (closed || button.disabled) return;
      closing = true; button.disabled = true; clearTimers();
      root.style.opacity = getComputedStyle(root).opacity;
      root.classList.add('is-skipping');
      timer = setTimeout(finish, 500);
    }
    function end(event) {
      if (event.target === root && closing) finish();
      else if (event.target === last && !closing && event.animationName === 'opening-letter') hold();
    }
    function motion() { if (reduced.matches) leave(); }
    function finish() {
      if (closed) return;
      closed = true; clearTimers();
      root.removeEventListener('animationend', end);
      root.removeEventListener('wheel', block);
      root.removeEventListener('touchmove', block);
      button.removeEventListener('click', skip);
      reduced.removeEventListener('change', motion);
      window.removeEventListener('hashchange', finish);
      window.removeEventListener('scroll', lock);
      root.remove(); document.body.classList.remove('is-opening');
      document.dispatchEvent(new Event('opening:end'));
      window.Beyond.motion?.requestRefresh();
    }
    root.addEventListener('animationend', end);
    root.addEventListener('wheel', block, { passive: false });
    root.addEventListener('touchmove', block, { passive: false });
    button.addEventListener('click', skip);
    reduced.addEventListener('change', motion);
    window.addEventListener('hashchange', finish);
    window.addEventListener('scroll', lock, { passive: true });
    document.body.classList.add('is-opening');
    root.hidden = false;
    timer = setTimeout(reduced.matches ? leave : finish, reduced.matches ? 3000 : 10000);
    return { destroy: finish };
  };
})();
