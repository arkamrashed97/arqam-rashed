import * as THREE from 'three';
import { mobileQuery } from '../core/env.js';
import { mulberry32 } from '../core/utils.js';
import { getDPR } from './renderer.js';
import { sceneState } from './scene-state.js';
import { NOISE_GLSL } from './shaders.js';

export const CLUSTER_DEFS = [
  { center: [-1.72, 0.92, -0.1], spread: [1.12, 0.72, 0.85] },
  { center: [1.34, 1.22, -0.45], spread: [1.02, 0.82, 0.92] },
  { center: [1.68, -0.86, 0.32], spread: [0.94, 0.66, 0.72] },
  { center: [-1.38, -1.18, -0.28], spread: [1.04, 0.78, 0.84] }
];

export function gaussian(rand) {
  return (rand() + rand() + rand() - 1.5) * 0.82;
}

export function buildActThree() {
  const group = new THREE.Group();
  group.position.set(0.12, 0.18, 0);
  group.scale.setScalar(mobileQuery.matches ? 0.82 : 1);
  sceneState.scene.add(group);

  const perCluster = mobileQuery.matches ? 340 : 560;
  const count = perCluster * CLUSTER_DEFS.length;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const clusters = new Float32Array(count);
  const seeds = new Float32Array(count);
  const rand = mulberry32(44117);

  let index = 0;
  CLUSTER_DEFS.forEach((def, c) => {
    for (let i = 0; i < perCluster; i++) {
      const jitter = 1 + (rand() - 0.5) * 0.35;
      positions[index * 3] = def.center[0] + gaussian(rand) * def.spread[0] * jitter;
      positions[index * 3 + 1] = def.center[1] + gaussian(rand) * def.spread[1] * jitter;
      positions[index * 3 + 2] = def.center[2] + gaussian(rand) * def.spread[2];
      sizes[index] = 0.75 + rand() * 1.7;
      clusters[index] = c;
      seeds[index] = rand();
      index++;
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aCluster', new THREE.BufferAttribute(clusters, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  const pointUniforms = {
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uActive: { value: 0 },
    uDpr: { value: getDPR() },
    uOpacity: { value: 0 },
    uMorph: { value: 0 },
    uVelocity: { value: 0 },
    uBurst: { value: 0 },
    uColor0: { value: new THREE.Color('#00F0FF') },
    uColor1: { value: new THREE.Color('#FFB800') },
    uColor2: { value: new THREE.Color('#8FE8FF') },
    uColor3: { value: new THREE.Color('#FFD27A') },
    uInk: { value: new THREE.Color('#040814') }
  };

  const pointMaterial = new THREE.ShaderMaterial({
    uniforms: pointUniforms,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    vertexShader: NOISE_GLSL + /* glsl */`
      attribute float aSize;
      attribute float aCluster;
      attribute float aSeed;
      uniform float uTime;
      uniform vec2 uPointer;
      uniform float uActive;
      uniform float uDpr;
      uniform float uOpacity;
      uniform float uMorph;
      uniform float uVelocity;
      uniform float uBurst;
      uniform vec3 uColor0;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform vec3 uInk;
      varying vec3 vColor;
      varying float vAlpha;

      void main(){
        vec3 p = position;
        float drift = snoise(p * 0.3 + vec3(aSeed * 5.0, uTime * 0.055, 0.0)) * 0.16;
        p += normalize(p + 0.0001) * drift;
        float d = distance(p.xy, uPointer);
        p.xy += (uPointer - p.xy) * smoothstep(1.55, 0.0, d) * 0.19;
        p.xy += normalize(p.xy + 0.0001) * uBurst * 0.24;

        float ang = atan(position.y, position.x);
        float radius = 2.48 + (fract(aSeed * 19.7) - 0.5) * 0.42;
        vec3 ring = vec3(
          cos(ang + uTime * 0.1) * radius,
          sin(ang + uTime * 0.1) * radius,
          (fract(aSeed * 7.13) - 0.5) * 0.24
        );
        p = mix(p, ring, smoothstep(0.0, 1.0, uMorph));

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;

        float sel = 1.0 - step(0.5, abs(aCluster - uActive));
        float size = aSize * (1.0 + sel * 0.7);
        gl_PointSize = size * uDpr * (36.0 / max(0.1, -mv.z)) * (1.0 + abs(uVelocity) * 0.35);

        vec3 base = aCluster < 0.5 ? uColor0 : aCluster < 1.5 ? uColor1 : aCluster < 2.5 ? uColor2 : uColor3;
        vColor = mix(base * (0.5 + sel * 0.95), uInk, uMorph * 0.86);
        vAlpha = uOpacity * (0.18 + sel * 0.44) * (1.0 - uMorph * 0.2);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vColor;
      varying float vAlpha;
      void main(){
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float core = smoothstep(0.5, 0.04, d);
        float halo = smoothstep(0.5, 0.16, d);
        float alpha = (core * 0.56 + halo * 0.16) * vAlpha;
        gl_FragColor = vec4(vColor * (0.55 + core * 0.9), alpha);
      }`
  });

  const points = new THREE.Points(geometry, pointMaterial);
  points.frustumCulled = false;
  group.add(points);

  buildTopologyEdges(positions, clusters, seeds, group, pointUniforms);
  buildPointerSprite(group);

  sceneState.pointsGroup = group;
  sceneState.pointMat = pointMaterial;
  sceneState.pointUniforms = pointUniforms;
  sceneState.topologyCount = count;
}

export function buildTopologyEdges(positions, clusters, seeds, parent, pointUniforms) {
  const count = clusters.length;
  const edgePositions = [];
  const edgeClusters = [];
  const edgeSeeds = [];
  const maxEdges = mobileQuery.matches ? 420 : 950;
  let edges = 0;

  for (let i = 0; i < count && edges < maxEdges; i += 2) {
    let best = -1;
    let bestDist = 1.45;
    for (let j = i + 1; j < count; j++) {
      if (clusters[j] !== clusters[i]) continue;
      const dx = positions[i * 3] - positions[j * 3];
      const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        best = j;
      }
    }
    if (best !== -1) {
      edgePositions.push(
        positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
        positions[best * 3], positions[best * 3 + 1], positions[best * 3 + 2]
      );
      edgeClusters.push(clusters[i], clusters[best]);
      edgeSeeds.push(seeds[i], seeds[best]);
      edges++;
    }
  }

  const bridges = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]];
  bridges.forEach(([a, b]) => {
    const ca = CLUSTER_DEFS[a].center;
    const cb = CLUSTER_DEFS[b].center;
    const mx = (ca[0] + cb[0]) / 2 + Math.sin(a * 2.1) * 0.35;
    const my = (ca[1] + cb[1]) / 2 + Math.cos(b * 1.7) * 0.32;
    const mz = (ca[2] + cb[2]) / 2;
    edgePositions.push(ca[0], ca[1], ca[2], mx, my, mz);
    edgePositions.push(mx, my, mz, cb[0], cb[1], cb[2]);
    edgeClusters.push(a, a, b, b);
    edgeSeeds.push(seeds[a] || 0.2, 0.6, seeds[b] || 0.8, 0.3);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
  geometry.setAttribute('aCluster', new THREE.Float32BufferAttribute(edgeClusters, 1));
  geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(edgeSeeds, 1));

  const uniforms = {
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uActive: { value: 0 },
    uOpacity: { value: 0 },
    uMorph: { value: 0 },
    uVelocity: { value: 0 },
    uColor0: { value: new THREE.Color('#00F0FF') },
    uColor1: { value: new THREE.Color('#FFB800') },
    uColor2: { value: new THREE.Color('#8FE8FF') },
    uColor3: { value: new THREE.Color('#FFD27A') },
    uInk: { value: new THREE.Color('#040814') }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: NOISE_GLSL + /* glsl */`
      attribute float aCluster;
      attribute float aSeed;
      uniform float uTime;
      uniform vec2 uPointer;
      uniform float uActive;
      uniform float uOpacity;
      uniform float uMorph;
      uniform vec3 uColor0;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform vec3 uInk;
      varying vec3 vColor;
      varying float vAlpha;

      void main(){
        vec3 p = position;
        float drift = snoise(p * 0.3 + vec3(aSeed * 4.0, uTime * 0.05, 0.0)) * 0.14;
        p += normalize(p + 0.0001) * drift;
        float d = distance(p.xy, uPointer);
        p.xy += (uPointer - p.xy) * smoothstep(1.55, 0.0, d) * 0.12;
        float ang = atan(position.y, position.x);
        float radius = 2.48 + (fract(aSeed * 19.7) - 0.5) * 0.42;
        vec3 ring = vec3(cos(ang + uTime * 0.1) * radius, sin(ang + uTime * 0.1) * radius, 0.0);
        p = mix(p, ring, smoothstep(0.0, 1.0, uMorph));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        float sel = 1.0 - step(0.5, abs(aCluster - uActive));
        vec3 base = aCluster < 0.5 ? uColor0 : aCluster < 1.5 ? uColor1 : aCluster < 2.5 ? uColor2 : uColor3;
        vColor = mix(base, uInk, uMorph * 0.9);
        vAlpha = uOpacity * (0.16 + sel * 0.48) * (1.0 - uMorph * 0.92);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vColor;
      varying float vAlpha;
      void main(){
        gl_FragColor = vec4(vColor, vAlpha);
      }`
  });

  const lines = new THREE.LineSegments(geometry, material);
  lines.frustumCulled = false;
  parent.add(lines);
  sceneState.lineMat = material;
  sceneState.lineUniforms = uniforms;
  sceneState.lineCount = edges;
}

export function buildPointerSprite(parent) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,.95)');
  grad.addColorStop(0.15, 'rgba(0,240,255,.7)');
  grad.addColorStop(0.5, 'rgba(0,240,255,.15)');
  grad.addColorStop(1, 'rgba(0,240,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.52, 0.52, 1);
  sprite.position.set(0, 0, 0.5);
  sprite.visible = false;
  parent.add(sprite);
  sceneState.pointerSprite = sprite;
  sceneState.pointerSpriteMat = material;
  sceneState.pointerSpriteTex = texture;
}
