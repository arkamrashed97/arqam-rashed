import * as THREE from 'three';
import { $$ } from '../core/utils.js';
import { sceneState } from './scene-state.js';

export async function loadProjectTextures() {
  if (!sceneState.renderer) return;
  const loader = new THREE.TextureLoader();
  const maxAniso = Math.min(8, sceneState.renderer.capabilities.getMaxAnisotropy());
  const images = $$('.project__img');
  const jobs = sceneState.planes.map(async (plane) => {
    const img = images[plane.index];
    if (!img || !img.src) return;
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
  });
  await Promise.allSettled(jobs);
}
