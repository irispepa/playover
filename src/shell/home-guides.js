// Read the games' own slides without game setup or guideSeen writes.
export async function loadGuide(id, isCurrent = () => true) {
  switch (id) {
    case 'oddcrown': {
      const guide = await import('../games/oddcrown/guide.js');
      return { pages: guide.GUIDE_PAGES, more: guide.MORE_PAGES };
    }
    case 'planets': {
      const guide = await import('../games/planets/guide.js');
      return { pages: guide.guidePages(), more: guide.morePages() };
    }
    case 'reef': return (await import('../games/reef/guide.js')).GUIDE;
    case 'helpdesk': {
      const guide = await import('../games/helpdesk/guide.js');
      return { pages: guide.GUIDE_PAGES, more: guide.MORE_PAGES };
    }
    case 'lanternfall': {
      const guide = await import('../games/lanternfall/ui/guide.js');
      return { pages: guide.GUIDE_PAGES, more: guide.MORE_PAGES };
    }
    case 'everbrook': {
      const [guide, models, THREE] = await Promise.all([
        import('../games/everbrook/howto.js'), import('../games/everbrook/models.js'), import('three'),
      ]);
      if (!isCurrent()) return null;
      const material = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .88, metalness: 0 });
      const thumb = (key) => models.thumbnail(key, material);
      try { return { pages: guide.guidePages(thumb), more: guide.morePages(thumb) }; }
      finally { models.disposeThumbs(); models.disposeModels(); material.dispose(); }
    }
    case 'builder': {
      const [guide, view, data, THREE] = await Promise.all([
        import('../games/builder/guide.js'), import('../games/builder/render.js'),
        import('../games/builder/data.js'), import('three'),
      ]);
      if (!isCurrent()) return null;
      const renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas'), antialias: true, alpha: true });
      try {
        const keys = [...data.BUILD_ORDER.map((type) => `${type}:1`), 'house:2', 'house:3', 'townhall:1'];
        const thumbs = view.makeThumbnails(renderer, keys);
        return { pages: guide.guidePages(thumbs), more: guide.morePages(thumbs) };
      } finally { renderer.dispose(); renderer.forceContextLoss(); }
    }
    case 'roguelike': {
      const guide = await import('../games/roguelike/guide.js');
      const keyboard = matchMedia('(hover: hover) and (pointer: fine)').matches;
      return { pages: guide.guidePages('warden', keyboard), more: guide.morePages('warden', keyboard) };
    }
    case 'towerdefence': {
      const guide = await import('../games/towerdefence/guide.js');
      return { pages: guide.guidePages(), more: guide.morePages() };
    }
    default: throw new Error(`Unknown game guide: ${id}`);
  }
}
