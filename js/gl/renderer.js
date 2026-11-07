import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mobileQuery } from '../core/env.js';
import { measureLayout } from '../core/scroll.js';
import { refs, state } from '../core/state.js';
import { sceneState } from './scene-state.js';
import { POST_SHADER } from './shaders.js';

const MAX_PIXELS_DESKTOP = 1920 * 1080 * 1.05;
const MAX_PIXELS_MOBILE = 800 * 800;

export function getDPR(scale = 1) {
  const raw = (window.devicePixelRatio || 1) * scale;
  const cap = mobileQuery.matches ? 1.0 : 1.25;
  let dpr = Math.min(raw, cap);
  const maxPixels = mobileQuery.matches ? MAX_PIXELS_MOBILE : MAX_PIXELS_DESKTOP;
  const pixels = window.innerWidth * dpr * (window.innerHeight * dpr);
  if (pixels > maxPixels) {
    dpr *= Math.sqrt(maxPixels / pixels);
  }
  return Math.max(0.7, Number(dpr.toFixed(2)));
}

export function setDynamicResolution(scale) {
  if (!sceneState.renderer) return;
  const dpr = getDPR(scale);
  if (Math.abs(dpr - sceneState.renderer.getPixelRatio()) < 0.04) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  sceneState.renderer.setPixelRatio(dpr);
  sceneState.renderer.setSize(w, h, false);
  if (sceneState.composer && !mobileQuery.matches) {
    sceneState.composer.setPixelRatio(dpr);
    sceneState.composer.setSize(w, h);
  }
  if (sceneState.fx) {
    sceneState.fx.uniforms.uResolution.value.set(w * dpr, h * dpr);
  }
  if (sceneState.pointUniforms) {
    sceneState.pointUniforms.uDpr.value = dpr;
  }
}

export function initGL() {
  const canvas = document.getElementById('gl');
  if (!canvas) return false;
  try {
    const dpr = getDPR();
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0x070708, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070708');

    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80);
    camera.position.set(0, 0, 8.5);

    let composer = null;
    let bloom = null;
    let fx = null;

    if (!mobileQuery.matches) {
      composer = new EffectComposer(renderer);
      composer.setPixelRatio(dpr);
      composer.setSize(window.innerWidth, window.innerHeight);
      composer.addPass(new RenderPass(scene, camera));

      // Half-resolution bloom cuts fragment shader cost by 75% with identical soft glow
      bloom = new UnrealBloomPass(
        new THREE.Vector2(Math.round(window.innerWidth * 0.5), Math.round(window.innerHeight * 0.5)),
        0.44,
        0.58,
        0.9
      );
      composer.addPass(bloom);

      fx = new ShaderPass(POST_SHADER);
      fx.uniforms.uResolution.value.set(window.innerWidth * dpr, window.innerHeight * dpr);
      composer.addPass(fx);
      composer.addPass(new OutputPass());
    }

    sceneState.renderer = renderer;
    sceneState.scene = scene;
    sceneState.camera = camera;
    sceneState.composer = composer;
    sceneState.bloom = bloom;
    sceneState.fx = fx;
    state.gl = true;

    if (refs.gpuMode) {
      refs.gpuMode.textContent = navigator.gpu ? 'WEBGL2 / WEBGPU READY' : 'WEBGL2 / GLSL';
    }
    if (refs.gpuReadout) refs.gpuReadout.textContent = navigator.gpu ? 'GL2+' : 'GL2';

    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      document.body.classList.add('no-gl', 'static-work');
      sceneState.glContextLost = true;
    }, false);

    canvas.addEventListener('webglcontextrestored', () => {
      document.body.classList.remove('no-gl', 'static-work');
      sceneState.glContextLost = false;
    }, false);

    return true;
  } catch (err) {
    document.body.classList.add('no-gl', 'static-work');
    state.gl = false;
    if (refs.gpuMode) refs.gpuMode.textContent = 'STATIC / NO WEBGL2';
    if (refs.gpuReadout) refs.gpuReadout.textContent = 'NONE';
    return false;
  }
}

export function applyResize() {
  if (!sceneState.renderer) {
    measureLayout();
    return;
  }
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = getDPR();

  sceneState.renderer.setPixelRatio(dpr);
  sceneState.renderer.setSize(w, h);
  if (sceneState.composer) {
    sceneState.composer.setPixelRatio(dpr);
    sceneState.composer.setSize(w, h);
  }
  sceneState.camera.aspect = w / h;
  sceneState.camera.updateProjectionMatrix();

  if (sceneState.fx) {
    sceneState.fx.uniforms.uResolution.value.set(w * dpr, h * dpr);
  }
  if (sceneState.pointUniforms) sceneState.pointUniforms.uDpr.value = dpr;

  if (sceneState.fermGroup) {
    sceneState.fermGroup.scale.setScalar(mobileQuery.matches ? 0.58 : 1.18);
    sceneState.fermGroup.position.set(mobileQuery.matches ? 0.78 : 0.32, mobileQuery.matches ? 0.78 : -0.06, 0);
  }
  if (sceneState.pointsGroup) {
    sceneState.pointsGroup.scale.setScalar(mobileQuery.matches ? 0.82 : 1);
  }
  if (sceneState.ringGroup) {
    sceneState.ringGroup.scale.setScalar(mobileQuery.matches ? 0.74 : 1);
  }

  measureLayout();
  ScrollTrigger.refresh();
}

export function setupResize() {
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      applyResize();
    });
  }, { passive: true });

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        measureLayout();
      });
    });
    ro.observe(document.body);
  }
}

export function renderStaticFallback() {
  refs.body.classList.add('no-gl', 'static-work');
  state.gl = false;
  if (refs.gpuMode) refs.gpuMode.textContent = 'STATIC / NO WEBGL2';
  if (refs.gpuReadout) refs.gpuReadout.textContent = 'NONE';
  refs.mediaEls.forEach((el) => {
    const img = el.querySelector('.project__img');
    if (img) img.style.opacity = '.92';
  });
}
