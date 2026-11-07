import * as THREE from 'three';
import { palette, rgbCss } from '../core/color.js';
import { mobileQuery } from '../core/env.js';
import { mulberry32 } from '../core/utils.js';
import { sceneState } from './scene-state.js';

export function buildActFour() {
  const group = new THREE.Group();
  group.position.set(0, -0.1, 0);
  group.scale.setScalar(mobileQuery.matches ? 0.74 : 1);
  sceneState.scene.add(group);
  sceneState.ringGroup = group;

  const vortexUniforms = {
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uInk: { value: new THREE.Color(rgbCss(palette.ink)) },
    uAccent: { value: new THREE.Color(rgbCss(palette.accent)) }
  };
  const vortexMat = new THREE.ShaderMaterial({
    uniforms: vortexUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uInk;
      uniform vec3 uAccent;
      varying vec2 vUv;
      void main(){
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        if (r > 1.0) discard;
        float a = atan(p.y, p.x);
        float swirl = sin(a * 7.0 + r * 22.0 - uTime * 2.4) * 0.5 + 0.5;
        float second = sin(a * -3.0 - r * 14.0 + uTime * 1.3) * 0.5 + 0.5;
        float edge = smoothstep(1.0, 0.62, r);
        float alpha = edge * (0.32 + swirl * 0.11 + second * 0.08);
        vec3 col = mix(uInk, uAccent, swirl * 0.25);
        gl_FragColor = vec4(col, alpha * uOpacity);
      }`
  });
  const vortex = new THREE.Mesh(new THREE.CircleGeometry(2.24, 96), vortexMat);
  vortex.position.z = -0.35;
  vortex.scale.setScalar(1.0);
  group.add(vortex);

  const ringMats = [];
  const ringConfigs = [
    { r: 2.3, t: 0.026, rx: 0.18, ry: 0.0, rz: 0.1, op: 0.96, speed: 0.12 },
    { r: 2.72, t: 0.009, rx: 0.34, ry: 0.2, rz: -0.2, op: 0.5, speed: -0.08 },
    { r: 3.12, t: 0.005, rx: -0.16, ry: 0.1, rz: 0.34, op: 0.32, speed: 0.05 },
    { r: 3.55, t: 0.0035, rx: 0.46, ry: -0.25, rz: -0.08, op: 0.2, speed: -0.04 }
  ];
  ringConfigs.forEach((cfg, i) => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(rgbCss(palette.ink)),
      transparent: true,
      opacity: cfg.op,
      depthWrite: false
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(cfg.r, cfg.t, 10, 260), mat);
    ring.rotation.set(cfg.rx, cfg.ry, cfg.rz);
    ring.userData.speed = cfg.speed;
    ring.userData.index = i;
    group.add(ring);
    ringMats.push({ mat, mesh: ring, baseOpacity: cfg.op });
  });

  const shardGroup = new THREE.Group();
  const shardGeometry = new THREE.BoxGeometry(0.12, 0.012, 0.012);
  const shardMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(rgbCss(palette.ink)),
    transparent: true,
    opacity: 0.55,
    depthWrite: false
  });
  const rand = mulberry32(7731);
  for (let i = 0; i < 26; i++) {
    const shard = new THREE.Mesh(shardGeometry, shardMat);
    const angle = rand() * Math.PI * 2;
    const radius = 2.5 + rand() * 1.15;
    shard.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, (rand() - 0.5) * 0.5);
    shard.rotation.set(rand() * Math.PI, rand() * Math.PI, angle);
    shard.scale.setScalar(0.55 + rand() * 1.9);
    shardGroup.add(shard);
  }
  group.add(shardGroup);

  // 3D Silk Sheet Floating on Water (replaces the old background square grid)
  const gridUniforms = {
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uRipple: { value: 0 },
    uAspect: { value: 1.6 },
    uInk: { value: new THREE.Color(rgbCss(palette.ink)) },
    uAccent: { value: new THREE.Color(rgbCss(palette.accent)) }
  };
  const gridMat = new THREE.ShaderMaterial({
    uniforms: gridUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      uniform float uTime;
      uniform vec2 uPointer;
      uniform float uRipple;
      uniform float uAspect;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying float vElev;
      varying float vWake;

      float sheetWave(vec2 p, float t, vec2 ptr, out float wakeOut) {
        // Layered silk-on-water swells
        float w1 = sin(p.x * 1.55 + p.y * 0.85 + t * 1.15) * 0.34;
        float w2 = cos(p.x * 0.95 - p.y * 1.75 + t * 0.88) * 0.28;
        float w3 = sin((p.x + p.y) * 2.6 - t * 1.65) * 0.14;
        float w4 = cos(length(p * vec2(0.75, 1.0)) * 3.1 - t * 1.3) * 0.16;

        // Interactive pointer/touch water depression & concentric ripple rings
        float d = length(p - ptr * 2.8);
        float well = -0.48 * exp(-d * d * 0.95);
        float ripple = sin(d * 9.5 - t * 5.8) * exp(-d * 1.15) * (0.24 + uRipple * 0.32);
        wakeOut = exp(-d * 0.85) * (0.55 + 0.45 * sin(d * 9.5 - t * 5.8));
        return w1 + w2 + w3 + w4 + well + ripple;
      }

      void main(){
        vUv = uv;
        vec2 p = (uv * 2.0 - 1.0) * vec2(uAspect * 2.2, 2.2);
        float eps = 0.04;
        float wakeC = 0.0;
        float wakeDummy = 0.0;
        float hC = sheetWave(p, uTime, uPointer, wakeC);
        float hX = sheetWave(p + vec2(eps, 0.0), uTime, uPointer, wakeDummy);
        float hY = sheetWave(p + vec2(0.0, eps), uTime, uPointer, wakeDummy);

        vec3 n = normalize(vec3((hC - hX) / eps, (hC - hY) / eps, 1.0));
        vNormal = n;
        vElev = hC;
        vWake = wakeC;

        vec3 displaced = position + vec3(0.0, 0.0, hC * 0.95);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime;
      uniform float uOpacity;
      uniform vec2 uPointer;
      uniform float uAspect;
      uniform vec3 uInk;
      uniform vec3 uAccent;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying float vElev;
      varying float vWake;

      void main(){
        vec2 centered = (vUv * 2.0 - 1.0) * vec2(uAspect, 1.0);
        vec3 N = normalize(vNormal);
        vec3 V = vec3(0.0, 0.0, 1.0);

        // Two grazing light sources for liquid silk sheen
        vec3 L1 = normalize(vec3(0.55, 0.68, 0.52));
        vec3 L2 = normalize(vec3(-0.62, -0.45, 0.64));

        float diff1 = max(0.0, dot(N, L1));
        float diff2 = max(0.0, dot(N, L2));

        vec3 H1 = normalize(L1 + V);
        vec3 H2 = normalize(L2 + V);
        float spec1 = pow(max(0.0, dot(N, H1)), 26.0);
        float spec2 = pow(max(0.0, dot(N, H2)), 18.0);

        // Fresnel silk fold rim + flowing water caustics (zero grid lines)
        float fresnel = pow(1.0 - max(0.0, dot(N, V)), 2.2);
        float silkFold = smoothstep(-0.45, 0.65, vElev);
        float caustic = pow(0.5 + 0.5 * sin(centered.x * 6.5 + vElev * 4.2 + uTime * 1.1) * cos(centered.y * 5.8 - vElev * 3.8 - uTime * 0.9), 3.0);

        vec3 baseTone = mix(uInk * 0.35, uInk, silkFold * 0.68 + diff1 * 0.32);
        vec3 sheenCol = mix(baseTone, uAccent, fresnel * 0.58 + caustic * 0.28 + vWake * 0.45);
        vec3 finalCol = sheenCol + (uInk * spec1 * 0.52) + (uAccent * spec2 * 0.44);

        float vignette = smoothstep(1.85, 0.28, length(centered * vec2(0.68, 0.95)));
        float alpha = (0.14 + fresnel * 0.36 + spec1 * 0.34 + spec2 * 0.22 + caustic * 0.14 + vWake * 0.26) * vignette * uOpacity;
        gl_FragColor = vec4(finalCol, clamp(alpha, 0.0, 0.78));
      }`
  });
  const segX = mobileQuery.matches ? 64 : 112;
  const segY = mobileQuery.matches ? 42 : 72;
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(44, 28, segX, segY), gridMat);
  grid.position.set(0, 0.05, -3.6);
  grid.rotation.x = -0.18;
  grid.renderOrder = 0;
  sceneState.scene.add(grid);

  sceneState.ringUniforms = vortexUniforms;
  sceneState.vortexMat = vortexMat;
  sceneState.vortexMesh = vortex;
  sceneState.ringMats = ringMats;
  sceneState.shardGroup = shardGroup;
  sceneState.shardMat = shardMat;
  sceneState.gridMat = gridMat;
  sceneState.gridUniforms = gridUniforms;
  sceneState.gridMesh = grid;
}
