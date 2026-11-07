import * as THREE from 'three';
import { refs } from '../core/state.js';
import { sceneState } from './scene-state.js';

export function makePlanePlaceholder(color) {
  const data = new Uint8Array([color[0], color[1], color[2], 255]);
  const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function buildActTwo() {
  const group = new THREE.Group();
  sceneState.scene.add(group);
  sceneState.planeGroup = group;

  refs.mediaEls.forEach((mediaEl, index) => {
    const uniforms = {
      uTex: { value: makePlanePlaceholder([242, 239, 233]) },
      uTime: { value: 0 },
      uHover: { value: 0 },
      uVelocity: { value: 0 },
      uOpacity: { value: 0 },
      uPlaneAspect: { value: 1.6 },
      uTexAspect: { value: 1.6 }
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform sampler2D uTex;
        uniform float uTime;
        uniform float uHover;
        uniform float uVelocity;
        uniform float uOpacity;
        uniform float uPlaneAspect;
        uniform float uTexAspect;
        varying vec2 vUv;

        vec2 coverUv(vec2 uv){
          if (uPlaneAspect > uTexAspect) {
            uv.y = (uv.y - 0.5) * (uTexAspect / uPlaneAspect) + 0.5;
          } else {
            uv.x = (uv.x - 0.5) * (uPlaneAspect / uTexAspect) + 0.5;
          }
          return uv;
        }

        void main(){
          vec2 uv = coverUv(vUv);
          float wave = sin(uv.y * 24.0 + uTime * 1.6) * 0.0013 + sin(uv.x * 15.0 - uTime * 1.2) * 0.0009;
          uv += wave * (1.0 + uHover * 1.7);
          float shift = 0.00008 + uHover * 0.0011 + abs(uVelocity) * 0.0009;
          vec3 col;
          col.r = texture2D(uTex, uv + vec2(shift, 0.0)).r;
          col.g = texture2D(uTex, uv).g;
          col.b = texture2D(uTex, uv - vec2(shift, 0.0)).b;
          float luma = dot(col, vec3(0.299, 0.587, 0.114));
          col = mix(col, vec3(luma), 0.16 - uHover * 0.16);
          float grain = fract(sin(dot(uv * vec2(1417.0, 831.0) + uTime, vec2(12.9898, 78.233))) * 43758.5453);
          col += (grain - 0.5) * 0.010;
          float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
          col = mix(col, vec3(0.04), smoothstep(0.006, 0.0, edge) * 0.7);
          gl_FragColor = vec4(col, uOpacity);
        }`
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    mesh.frustumCulled = false;
    mesh.renderOrder = 3;
    mesh.visible = false;
    group.add(mesh);
    sceneState.planes.push({ mesh, material, mediaEl, index });
  });

  buildMonoliths(group);
}

export function buildMonoliths(parent) {
  const group = new THREE.Group();
  parent.add(group);
  sceneState.monolithGroup = group;
  sceneState.monolithMats = [];
  sceneState.monolithLines = [];

  const layouts = [
    { w: 1.25, h: 3.8, x: -4.6, y: 0.4, z: -2.3, ry: 0.35, rz: -0.06, rx: 0.04 },
    { w: 2.5, h: 0.9, x: 3.7, y: 1.75, z: -3.1, ry: -0.4, rz: 0.14, rx: 0.1 },
    { w: 1.9, h: 1.9, x: 4.2, y: -1.65, z: -2.4, ry: 0.5, rz: -0.08, rx: -0.06 },
    { w: 0.75, h: 2.7, x: -3.2, y: -1.4, z: -3.6, ry: -0.25, rz: 0.05, rx: 0.1 },
    { w: 3.2, h: 0.7, x: -0.4, y: 2.6, z: -4.2, ry: -0.18, rz: 0.02, rx: -0.1 },
    { w: 1.4, h: 1.1, x: 2.3, y: -2.3, z: -4.7, ry: 0.2, rz: 0.12, rx: 0.04 }
  ];

  const fillGeometry = new THREE.PlaneGeometry(1, 1);
  layouts.forEach((layout, i) => {
    const fillMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#111111'),
      transparent: true,
      opacity: 0.035,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const fill = new THREE.Mesh(fillGeometry, fillMat);
    fill.scale.set(layout.w, layout.h, 1);
    fill.position.set(layout.x, layout.y, layout.z);
    fill.rotation.set(layout.rx, layout.ry, layout.rz);
    group.add(fill);
    sceneState.monolithMats.push(fillMat);

    const edgeGeom = new THREE.EdgesGeometry(new THREE.PlaneGeometry(layout.w, layout.h));
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#FF3B00'),
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    });
    const line = new THREE.LineSegments(edgeGeom, lineMat);
    line.position.copy(fill.position);
    line.rotation.copy(fill.rotation);
    group.add(line);
    sceneState.monolithLines.push({ line, lineMat, baseX: layout.x, baseY: layout.y, baseRz: layout.rz, seed: i });
  });

  group.traverse((child) => {
    if (child.geometry && child.geometry !== fillGeometry) child.userData.ownGeometry = true;
  });
  group.userData.fillGeometry = fillGeometry;
}
