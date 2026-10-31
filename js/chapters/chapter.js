(() => {
  const app = window.Beyond;
  app.chapters = app.chapters || {};

  /** Default composition controller. Future chapters replace it via registry.register().
   * Owns its trigger and progress attributes; adds no chapter-specific animation.
   */
  app.initChapter = (root, context, options = {}) => {
    const previous = ['progress', 'active'].map(key => root.getAttribute('data-' + key));
    let destroyed = false;
    let trigger;
    const controller = {
      setProgress(value, active = value > 0 && value < 1) {
        if (destroyed) return;
        const progress = Math.max(0, Math.min(1, Number(value) || 0));
        root.dataset.progress = progress.toFixed(4);
        root.dataset.active = String(active);
        context.onChange(progress, active);
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        trigger?.kill();
        ['progress', 'active'].forEach((key, index) => {
          if (previous[index] === null) root.removeAttribute('data-' + key);
          else root.setAttribute('data-' + key, previous[index]);
        });
      },
    };
    try {
      if (context.ScrollTrigger) {
        trigger = context.ScrollTrigger.create({
          id: 'chapter-' + root.id,
          trigger: root,
          start: options.start || (() => 'top ' + context.headerOffset() + 'px'),
          end: options.end || (() => 'bottom ' + context.headerOffset() + 'px'),
          onUpdate: self => controller.setProgress(self.progress, self.isActive),
          onRefresh: self => controller.setProgress(self.progress, self.isActive),
        });
      }
      controller.setProgress(trigger?.progress || 0, trigger?.isActive || false);
      return controller;
    } catch (error) {
      controller.destroy();
      throw error;
    }
  };
})();
