(() => {
  const app = window.Beyond;
  app.chapters.dimension = (root, context) => {
    const sceneRoot = root.querySelector('.scene');
    const mount = root.querySelector('.canvas');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const original = root.getAttribute('data-view');
    const originalStyle = root.getAttribute('style');
    let base, renderer, scene, camera, group, geometry, material, environment;
    let pieces = [];
    let frame = 0;
    let generation = 0;
    let destroyed = false;
    let loading = false;
    let failed = false;
    let near = false;
    let visible = false;
    let progress = 0;
    let current = 0;
    let departure = 0;
    let currentDeparture = 0;
    const size = { width: 0, height: 0, ratio: 0 };
    const pointer = { x: 0, y: 0, currentX: 0, currentY: 0 };

    const clamp = value => Math.max(0, Math.min(1, value));
    function requestRender() {
      if (!destroyed && renderer && visible && !document.hidden && !frame) frame = requestAnimationFrame(render);
    }
    function stop() { cancelAnimationFrame(frame); frame = 0; }
    function render() {
      frame = 0;
      if (!renderer || destroyed || !visible || document.hidden) return;
      current += (progress - current) * .14;
      currentDeparture += (departure - currentDeparture) * .14;
      pointer.currentX += (pointer.x - pointer.currentX) * .1;
      pointer.currentY += (pointer.y - pointer.currentY) * .1;
      const spread = clamp((current - .3) / .4) + currentDeparture * 1.6;
      const travel = clamp((current - .7) / .3);
      group.rotation.set(.28 + current * .6 + currentDeparture * .25 + pointer.currentY, .55 + current * Math.PI * 1.4 + currentDeparture * .6 + pointer.currentX, current * .15);
      const narrow = camera.aspect < .9;
      group.scale.setScalar(narrow ? .72 : .84);
      group.position.set(narrow ? 0 : .8, narrow ? -.12 : -.05, 0);
      pieces.forEach(({ mesh, home, axis }, index) => {
        mesh.position.copy(home).multiplyScalar(1 + spread * 2.4);
        mesh.rotation.set(spread * axis.x, spread * axis.y, spread * axis.z);
        mesh.scale.setScalar(1 - clamp(spread) * .12 + Math.sin(index) * .025);
      });
      const fit = Math.max(1, 1.1 / camera.aspect);
      camera.position.set(travel * .3, travel * .15, (8.5 - travel * 3.6) * fit);
      camera.lookAt(0, 0, 0);
      try { renderer.render(scene, camera); }
      catch { fallback(); return; }
      if (Math.abs(progress - current) > .0001 || Math.abs(departure - currentDeparture) > .0001 || Math.abs(pointer.x - pointer.currentX) > .0001 || Math.abs(pointer.y - pointer.currentY) > .0001) requestRender();
    }
    function resize() {
      if (!renderer) return;
      const { width, height } = sceneRoot.getBoundingClientRect();
      if (!width || !height) return;
      const ratio = Math.min(devicePixelRatio || 1, fine.matches ? 1.5 : 1);
      if (size.width === width && size.height === height && size.ratio === ratio) return;
      if (size.ratio !== ratio) renderer.setPixelRatio(ratio);
      Object.assign(size, { width, height, ratio });
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      requestRender();
    }
    function dispose() {
      stop();
      if (renderer) {
        renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      }
      geometry?.dispose();
      material?.dispose();
      environment?.dispose();
      scene?.clear();
      pieces = [];
      renderer = scene = camera = group = geometry = material = environment = null;
      size.width = size.height = size.ratio = 0;
    }
    function mountBase() {
      base?.destroy();
      base = app.initChapter(root, {
        ...context,
        onChange(value, active) { progress = value; context.onChange(value, active); requestRender(); },
      }, { end: renderer ? 'bottom bottom' : undefined });
      context.requestRefresh();
    }
    function fallback() {
      failed = true;
      dispose();
      root.dataset.view = 'poster';
      mountBase();
    }
    function onContextLost(event) { event.preventDefault(); fallback(); }
    async function initialize() {
      if (destroyed || loading || renderer || failed || !near || reduced.matches) return;
      const version = ++generation;
      loading = true;
      try {
        const THREE = await app.loadThree();
        if (destroyed || version !== generation || reduced.matches) return;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(42, 1, .1, 60);
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: fine.matches, powerPreference: 'low-power' });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.addEventListener('webglcontextlost', onContextLost);
        mount.append(renderer.domElement);
        group = new THREE.Group();
        scene.add(group);
        const shape = new THREE.Shape();
        shape.moveTo(-.22, -.28); shape.lineTo(.22, -.28);
        shape.quadraticCurveTo(.28, -.28, .28, -.22); shape.lineTo(.28, .22);
        shape.quadraticCurveTo(.28, .28, .22, .28); shape.lineTo(-.22, .28);
        shape.quadraticCurveTo(-.28, .28, -.28, .22); shape.lineTo(-.28, -.22);
        shape.quadraticCurveTo(-.28, -.28, -.22, -.28);
        geometry = new THREE.ExtrudeGeometry(shape, { depth: .5, bevelEnabled: true, bevelThickness: .05, bevelSize: .035, bevelSegments: 3, steps: 1, curveSegments: 4 });
        geometry.center();
        material = new THREE.MeshStandardMaterial({ color: 0xdedede, metalness: 1, roughness: .18, envMapIntensity: 1.35 });
        // Procedural studio reflections: no file texture or external environment map.
        const pixels = new Uint8Array(256 * 128 * 4);
        for (let y = 0; y < 128; y++) for (let x = 0; x < 256; x++) {
          const u = x / 256, v = y / 128;
          const strip = (center, size) => Math.exp(-Math.pow((u - center) / size, 8));
          const light = Math.min(1, (strip(.2, .045) + strip(.65, .075)) * Math.sin(v * Math.PI));
          const i = (y * 256 + x) * 4;
          pixels[i] = pixels[i + 1] = pixels[i + 2] = 15 + light * 235;
          pixels[i + 3] = 255;
        }
        const texture = new THREE.DataTexture(pixels, 256, 128, THREE.RGBAFormat);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        const pmrem = new THREE.PMREMGenerator(renderer);
        try { environment = pmrem.fromEquirectangular(texture); scene.environment = environment.texture; }
        finally { texture.dispose(); pmrem.dispose(); }
        for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
          if (!x && !y && !z) continue;
          const mesh = new THREE.Mesh(geometry, material);
          const home = new THREE.Vector3(x * .73, y * .73, z * .73);
          mesh.position.copy(home);
          group.add(mesh);
          pieces.push({ mesh, home, axis: new THREE.Vector3(y * 1.4 + .3, z * 1.6, x * 1.2) });
        }
        scene.add(new THREE.HemisphereLight(0xffffff, 0x242424, .6));
        [[0xffffff, 3, 3, 4, 5], [0xffffff, 3, -4, 1, 2], [0xffffff, 2, 1, -3, -3]].forEach(([color, intensity, x, y, z]) => {
          const light = new THREE.DirectionalLight(color, intensity);
          light.position.set(x, y, z);
          scene.add(light);
        });
        root.dataset.view = '3d';
        mountBase();
        current = progress;
        resize();
      } catch { if (!destroyed && version === generation) fallback(); }
      finally { if (version === generation) loading = false; }
    }
    function onPointer(event) {
      if (!fine.matches || event.pointerType !== 'mouse') return;
      const rect = sceneRoot.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - .5) * .5;
      pointer.y = ((event.clientY - rect.top) / rect.height - .5) * .35;
      requestRender();
    }
    function resetPointer() { pointer.x = pointer.y = 0; requestRender(); }
    function onExit(event) { departure = clamp(event.detail); requestRender(); }
    function onVisibility() { if (document.hidden) stop(); else requestRender(); }
    function onMode() {
      generation++;
      loading = false;
      resetPointer();
      if (reduced.matches) {
        dispose();
        root.dataset.view = 'poster';
        mountBase();
      } else { resize(); initialize(); }
    }
    root.dataset.view = 'poster';
    mountBase();
    const proximity = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      near = entries[0].isIntersecting;
      if (near) initialize();
    }, { rootMargin: '600px 0px' }) : null;
    const visibility = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) requestRender(); else { resetPointer(); stop(); }
    }) : null;
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    proximity?.observe(root);
    visibility?.observe(root);
    observer?.observe(sceneRoot);
    if (!proximity) { near = visible = true; initialize(); }
    root.addEventListener('pointermove', onPointer, { passive: true });
    root.addEventListener('pointerleave', resetPointer);
    root.addEventListener('chapter:exit', onExit);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    reduced.addEventListener('change', onMode);
    fine.addEventListener('change', onMode);
    return {
      setProgress(value, active) { if (!destroyed) base?.setProgress(value, active); },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        generation++;
        proximity?.disconnect();
        visibility?.disconnect();
        observer?.disconnect();
        root.removeEventListener('pointermove', onPointer);
        root.removeEventListener('pointerleave', resetPointer);
        root.removeEventListener('chapter:exit', onExit);
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', onVisibility);
        reduced.removeEventListener('change', onMode);
        fine.removeEventListener('change', onMode);
        base?.destroy();
        dispose();
        if (original === null) root.removeAttribute('data-view'); else root.setAttribute('data-view', original);
        if (originalStyle === null) root.removeAttribute('style'); else root.setAttribute('style', originalStyle);
      },
    };
  };
})();
