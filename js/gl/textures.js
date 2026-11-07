import * as THREE from 'three';
import { mobileQuery } from '../core/env.js';
import { $$ } from '../core/utils.js';
import { sceneState } from './scene-state.js';

let texturesLoaded = false;

export async function loadProjectTextures() {
  if (texturesLoaded || !sceneState.renderer || mobileQuery.matches) return;
  texturesLoaded = true;
  const loader = new THREE.TextureLoader();
  const maxAniso = Math.min(4, sceneState.renderer.capabilities.getMaxAnisotropy());
  const images = $$('.project__img');
  for (let i = 0; i < sceneState.planes.length; i++) {
    const plane = sceneState.planes[i];
    const img = images[plane.index];
    if (!img || !img.src) continue;
    try {
      const texture = await loader.loadAsync(img.src);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = maxAniso;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.needsUpdate = true;
      const previous = plane.material.uniforms.uTex.value;
      if (previous && previous.isDataTexture) previous.dispose();
      plane.material.uniforms.uTex.value = texture;
      const w = texture.image && texture.image.width ? texture.image.width : 1280;
      const h = texture.image && texture.image.height ? texture.image.height : 800;
      plane.material.uniforms.uTexAspect.value = w / h;
      sceneState.textures.push(texture);
    } catch (err) {
      plane.material.uniforms.uTexAspect.value = 1.6;
    }
  }
}

export function observeProjectTextures() {
  if (texturesLoaded || mobileQuery.matches) return;
  const workEl = document.getElementById('work');
  if (!workEl || !('IntersectionObserver' in window)) {
    window.setTimeout(() => loadProjectTextures(), 1200);
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting) {
        io.disconnect();
        loadProjectTextures();
        return;
      }
    }
  }, { rootMargin: '900px 0px' });
  io.observe(workEl);
}
