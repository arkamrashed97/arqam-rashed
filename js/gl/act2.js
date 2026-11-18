import * as THREE from 'three';
import { sceneState } from './scene-state.js';

export function buildActTwo() {
  const group = new THREE.Group();
  sceneState.scene.add(group);
  sceneState.planeGroup = group;
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
