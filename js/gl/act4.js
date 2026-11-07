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
        vec3 col = mix(uInk, uAccent, swirl * 0.18);
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

  const gridUniforms = {
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uAspect: { value: 1.6 },
    uInk: { value: new THREE.Color(rgbCss(palette.ink)) }
  };
  const gridMat = new THREE.ShaderMaterial({
    uniforms: gridUniforms,
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
      uniform vec2 uPointer;
      uniform float uAspect;
      uniform vec3 uInk;
      varying vec2 vUv;
      void main(){
        vec2 p = (vUv * 2.0 - 1.0) * vec2(uAspect, 1.0);
        vec2 m = uPointer * vec2(uAspect, 1.0);
        float d = length(p - m);
        p += normalize(p - m + 0.0001) * (0.2 / (d + 0.42));
        vec2 g = abs(fract(p * 7.0) - 0.5);
        float line = smoothstep(0.462, 0.5, max(g.x, g.y));
        float rings = smoothstep(0.08, 0.0, abs(length(p) - 2.3 - sin(uTime * 0.7) * 0.08));
        float fade = smoothstep(1.55, 0.35, length(p * vec2(0.72, 1.0)));
        float alpha = (line * 0.4 + rings * 0.55) * fade * uOpacity;
        gl_FragColor = vec4(uInk, alpha);
      }`
  });
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(42, 26), gridMat);
  grid.position.set(0, 0.1, -3.8);
  grid.rotation.x = -0.04;
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
