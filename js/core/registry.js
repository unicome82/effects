(() => {
  const app = window.Beyond;
  /** One controller per section. init/destroy may be repeated safely.
   * register(id, factory) replaces only that chapter, preserving its progress.
   */
  app.createRegistry = (roots, context) => {
    const records = new Map();
    let running = false;
    roots.forEach(root => {
      if (!root.id || records.has(root.id) || root.dataset.chapter !== root.id) throw new Error('Invalid chapter ID');
      records.set(root.id, { root, factory: app.chapters[root.id] || app.initChapter, controller: null, progress: 0, active: false });
    });

    function mount(record, preserve = false) {
      if (record.controller) return;
      const { progress, active } = record;
      const controller = record.factory(record.root, {
        ...context,
        onChange(progress, active) {
          const changed = record.active !== active;
          record.progress = progress;
          record.active = active;
          if (changed) context.onActiveChange?.();
        },
      });
      if (!controller || typeof controller.destroy !== 'function') throw new Error('Chapter controller requires destroy()');
      record.controller = controller;
      if (preserve) controller.setProgress?.(progress, active);
    }

    return {
      init() {
        if (running) return;
        running = true;
        try { records.forEach(record => mount(record)); }
        catch (error) { this.destroy(); throw error; }
      },
      register(id, factory) {
        const record = records.get(id);
        if (!record || typeof factory !== 'function') throw new Error('Unknown chapter or invalid factory');
        if (record.factory === factory) return;
        record.controller?.destroy();
        record.controller = null;
        record.factory = factory;
        if (running) mount(record, true);
        context.requestRefresh();
      },
      update(id, progress, active) {
        const record = records.get(id);
        if (!running || !record) return;
        record.controller?.setProgress?.(progress, active);
      },
      snapshot() {
        return [...records].map(([id, record]) => ({ id, progress: record.progress, active: record.active }));
      },
      destroy() {
        running = false;
        [...records.values()].reverse().forEach(record => {
          record.controller?.destroy();
          record.controller = null;
        });
      },
    };
  };
})();
