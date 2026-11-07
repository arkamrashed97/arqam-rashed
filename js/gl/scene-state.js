import * as THREE from 'three';

export const sceneState = {
  camera: null,
  renderer: null,
  composer: null,
  scene: null,
  bloom: null,
  fx: null,
  fermGroup: null,
  fermMat: null,
  planes: [],
  monolithGroup: null,
  pointsGroup: null,
  pointMat: null,
  lineMat: null,
  ringGroup: null,
  ringMats: [],
  gridMat: null,
  portalMats: [],
  dustMat: null,
  dummy: new THREE.Object3D(),
  pointerWorld: new THREE.Vector3(),
  act4Blend: false
};
sceneState.textures = [];
