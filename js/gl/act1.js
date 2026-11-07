import * as THREE from 'three';
import { mobileQuery } from '../core/env.js';
import { mulberry32 } from '../core/utils.js';
import { sceneState } from './scene-state.js';
import { NOISE_GLSL } from './shaders.js';

export function buildActOne() {
  const group = new THREE.Group();
  group.position.set(0.32, -0.06, 0);
  group.scale.setScalar(1.18);

  const uniforms = {
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector3(0, 0, 1) },
    uPointerAmt: { value: 0.9 },
    uVelocity: { value: 0 },
    uOpacity: { value: 1 },
    uAmp: { value: 1 },
    uInk: { value: new THREE.Color('#E2E2E5') },
    uAccent: { value: new THREE.Color('#D4FF00') }
  };

  const geometry = new THREE.IcosahedronGeometry(1.42, mobileQuery.matches ? 16 : 22);
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: true,
    vertexShader: NOISE_GLSL + /* glsl */`
      uniform float uTime;
      uniform vec3 uPointer;
      uniform float uPointerAmt;
      uniform float uVelocity;
      uniform float uOpacity;
      uniform float uAmp;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      varying vec3 vViewDir;
      varying float vDisp;
      varying float vNoise;

      float field(vec3 dir){
        float t = uTime * 0.18;
        float n = snoise(dir * 1.55 + vec3(0.0, 0.0, t));
        n += 0.46 * snoise(dir * 3.25 + vec3(t * 0.7, -t * 0.4, 0.0));
        n += 0.2 * snoise(dir * 6.8 + vec3(0.0, t * 1.1, 0.0));
        return n;
      }

      float displaced(vec3 dir){
        float d = field(dir) * 0.17 * uAmp;
        float mouse = smoothstep(0.74, 0.0, distance(dir, uPointer));
        d -= mouse * uPointerAmt * 0.24;
        d += sin(dot(dir, vec3(0.0, 1.0, 0.0)) * 9.0 + uTime * 2.2) * uVelocity * 0.026;
        return d;
      }

      void main(){
        vec3 dir = normalize(position);
        vec3 tangent = cross(vec3(0.0, 1.0, 0.0), dir);
        if (length(tangent) < 0.001) tangent = vec3(1.0, 0.0, 0.0);
        tangent = normalize(tangent);
        vec3 bitangent = normalize(cross(dir, tangent));

        float d0 = displaced(dir);
        vec3 pa = normalize(dir + tangent * 0.022);
        vec3 pb = normalize(dir + bitangent * 0.022);
        float da = displaced(pa);
        float db = displaced(pb);

        vec3 p0 = dir * (1.0 + d0);
        vec3 pA = pa * (1.0 + da);
        vec3 pB = pb * (1.0 + db);
        vec3 dispNormal = normalize(cross(pA - p0, pB - p0));

        vec4 world = modelMatrix * vec4(p0, 1.0);
        vPosW = world.xyz;
        vNormalW = normalize(mat3(modelMatrix) * dispNormal);
        vViewDir = normalize(cameraPosition - world.xyz);
        vDisp = d0;
        vNoise = field(dir);

        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uInk;
      uniform vec3 uAccent;
      uniform float uOpacity;
      uniform float uVelocity;
      uniform float uTime;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      varying vec3 vViewDir;
      varying float vDisp;
      varying float vNoise;

      void main(){
        vec3 n = normalize(vNormalW);
        vec3 viewDir = normalize(vViewDir);
        float fres = pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), 2.2);
        vec3 lightDir = normalize(vec3(-0.45, 0.85, 0.65));
        vec3 halfV = normalize(lightDir + viewDir);
        float spec = pow(max(dot(n, halfV), 0.0), 46.0);
        vec3 dark = vec3(0.011, 0.012, 0.014);
        vec3 metal = mix(dark, uInk * 0.44, smoothstep(-0.2, 0.72, vDisp * 5.2 + 0.28));
        vec3 col = metal;
        col += uAccent * fres * (0.42 + abs(uVelocity) * 0.9);
        col += vec3(spec) * uInk * 0.62 + uAccent * spec * 0.26;
        float bands = sin(vDisp * 68.0 + vNoise * 9.5 - uTime * 1.8);
        col += uAccent * bands * 0.02 * fres;
        float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        col += (grain - 0.5) * 0.028;
        gl_FragColor = vec4(col, uOpacity);
      }`
  });

  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);

  const wireMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#D4FF00'),
    wireframe: true,
    transparent: true,
    opacity: 0.022,
    depthWrite: false
  });
  const wire = new THREE.Mesh(geometry, wireMat);
  wire.scale.setScalar(1.035);
  group.add(wire);

  const ringMats = [];
  const ringGeometry = new THREE.TorusGeometry(1.78, 0.0045, 6, 220);
  for (let i = 0; i < 3; i++) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#D4FF00'),
      transparent: true,
      opacity: 0.10 - i * 0.022,
      depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeometry, ringMat);
    ring.rotation.set(Math.PI * 0.5 + i * 0.42, i * 0.7, i * 0.35);
    ring.scale.setScalar(1 + i * 0.17);
    group.add(ring);
    ringMats.push(ringMat);
  }

  sceneState.scene.add(group);
  sceneState.fermGroup = group;
  sceneState.fermMat = material;
  sceneState.fermWireMat = wireMat;
  sceneState.fermRingMats = ringMats;
  sceneState.fermUniforms = uniforms;
  sceneState.fermRings = group.children.filter((c) => c.geometry === ringGeometry);
  sceneState.fermRingGeometry = ringGeometry;
  sceneState.pointerLocal = new THREE.Vector3();
  sceneState.pointerProbe = new THREE.Vector3();
  sceneState.dust = buildDust();
}

export function buildDust() {
  const count = mobileQuery.matches ? 260 : 620;
  const positions = new Float32Array(count * 3);
  const rand = mulberry32(9821);
  for (let i = 0; i < count; i++) {
    const r = 2.4 + rand() * 5.4;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(rand() * 2 - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.65;
    positions[i * 3 + 2] = r * Math.cos(phi) * 0.7 - 1.4;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: new THREE.Color('#E2E2E5'),
    size: 0.017,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    sizeAttenuation: true
  });
  const points = new THREE.Points(geometry, material);
  sceneState.scene.add(points);
  sceneState.dustMat = material;
  sceneState.dustPoints = points;
  return points;
}
