(() => {
  /** Native anchors/history remain in charge of scrolling. Only focus/current state is added. */
  window.Beyond.createNavigation = (root, { $ } = {}) => {
    const links = [...root.querySelectorAll('nav a[href^="#"]')];
    const previous = links.map(link => link.getAttribute('aria-current'));
    let focusFrame = 0;
    let destroyed = false;
    function onClick(event) {
      const link = event.target.closest('a[href^="#"]');
      if (!link || event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      let target;
      try { target = document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch { return; }
      if (!target) return;
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => target.focus({ preventScroll: true }));
    }
    if ($) $(root).on('click.beyondNav', 'a[href^="#"]', onClick);
    else root.addEventListener('click', onClick);

    return {
      update(id) {
        if (destroyed) return;
        links.forEach(link => {
          if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        cancelAnimationFrame(focusFrame);
        if ($) $(root).off('.beyondNav');
        else root.removeEventListener('click', onClick);
        links.forEach((link, index) => {
          if (previous[index] === null) link.removeAttribute('aria-current');
          else link.setAttribute('aria-current', previous[index]);
        });
      },
    };
  };
})();
