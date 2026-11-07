import * as THREE from 'three';
import { finePointerQuery, mobileQuery } from '../core/env.js';
import { state } from '../core/state.js';
import { clamp, damp, lerp, smoothstep } from '../core/utils.js';
import { sceneState } from './scene-state.js';

export function worldViewSize() {
  const camera = sceneState.camera;
  const h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) * camera.position.z;
  return { h, w: h * camera.aspect };
}

export function updatePlanes(planesWeight, dt) {
  if (!sceneState.planes.length || !sceneState.camera) return;
  const canShow = planesWeight > 0.008 && !mobileQuery.matches;
  if (sceneState.planeGroup) sceneState.planeGroup.visible = canShow;
  if (!canShow) {
    for (let i = 0; i < sceneState.planes.length; i++) {
      sceneState.planes[i].mesh.visible = false;
    }
    return;
  }
  const view = worldViewSize();
  for (let i = 0; i < sceneState.planes.length; i++) {
    const plane = sceneState.planes[i];
    const rect = plane.mediaEl.getBoundingClientRect();
    const onScreen = rect.width > 2 && rect.height > 2 &&
      rect.bottom > -80 && rect.top < window.innerHeight + 80 &&
      rect.right > -80 && rect.left < window.innerWidth + 80;
    plane.mesh.visible = onScreen;
    if (!onScreen) continue;

    const hoverTarget = state.hoverProject === i && state.pointerMoved ? 1 : 0;
    plane.material.uniforms.uHover.value = damp(plane.material.uniforms.uHover.value, hoverTarget, 7, dt);
    plane.material.uniforms.uTime.value = state.time;
    plane.material.uniforms.uVelocity.value = state.velocitySmooth;
    plane.material.uniforms.uOpacity.value = planesWeight;

    const cx = (rect.left + rect.width * 0.5) / window.innerWidth - 0.5;
    const cy = 0.5 - (rect.top + rect.height * 0.5) / window.innerHeight;
    plane.mesh.position.set(cx * view.w, cy * view.h, 0);
    plane.mesh.scale.set((rect.width / window.innerWidth) * view.w, (rect.height / window.innerHeight) * view.h, 1);
    plane.material.uniforms.uPlaneAspect.value = rect.width / Math.max(1, rect.height);
  }
}

/**
 * Per-frame scene update with strict offscreen culling:
 * Any Act group whose opacity weight is <= 0.004 is hidden and its uniform/matrix work is
 * skipped completely so scrolling between sections never pays for 4 worlds at once.
 */
export function updateScene(dt) {
  if (!sceneState.scene) return;
  const m1 = state.m1 || 0;
  const m2 = state.m2 || 0;
  const m3 = state.m3 || 0;
  const fermWeight = clamp(1 - m1, 0, 1);
  const planesWeight = m1 * (1 - m2);
  const pointsWeight = m2 * (1 - smoothstep(0.45, 0.92, m3));
  const portalGate = smoothstep(0.32, 0.82, m3);
  const gridGate = smoothstep(0.52, 0.95, m3);

  const view = worldViewSize();
  const pointerWorldX = state.pointerNX * view.w * 0.5;
  const pointerWorldY = state.pointerNY * view.h * 0.5;
  sceneState.pointerWorld.set(pointerWorldX, pointerWorldY, 0);

  if (sceneState.fermGroup) {
    const visible = fermWeight > 0.004;
    sceneState.fermGroup.visible = visible;
    if (sceneState.dustPoints) sceneState.dustPoints.visible = fermWeight > 0.01;
    if (visible) {
      const u = sceneState.fermUniforms;
      u.uTime.value = state.time;
      u.uVelocity.value = state.velocitySmooth;
      u.uOpacity.value = fermWeight;
      sceneState.pointerProbe.set(pointerWorldX, pointerWorldY, 2.4);
      sceneState.fermGroup.updateMatrixWorld(true);
      sceneState.pointerLocal.copy(sceneState.pointerProbe);
      sceneState.fermGroup.worldToLocal(sceneState.pointerLocal);
      if (sceneState.pointerLocal.lengthSq() > 0.0001) sceneState.pointerLocal.normalize();
      u.uPointer.value.copy(sceneState.pointerLocal);

      if (state.motion) {
        sceneState.fermGroup.rotation.y += dt * 0.075;
        sceneState.fermGroup.rotation.x = Math.sin(state.time * 0.22) * 0.16;
        sceneState.fermGroup.rotation.z = Math.cos(state.time * 0.17) * 0.1;
        if (sceneState.fermRings) {
          for (let i = 0; i < sceneState.fermRings.length; i++) {
            sceneState.fermRings[i].rotation.z += dt * (0.08 + i * 0.03) * (i % 2 ? -1 : 1);
          }
        }
        if (sceneState.dustPoints) sceneState.dustPoints.rotation.y += dt * 0.012;
      }
      if (sceneState.fermWireMat) sceneState.fermWireMat.opacity = 0.022 * fermWeight;
      if (sceneState.fermRingMats) {
        for (let i = 0; i < sceneState.fermRingMats.length; i++) {
          sceneState.fermRingMats[i].opacity = (0.10 - i * 0.022) * fermWeight;
        }
      }
      if (sceneState.dustMat) sceneState.dustMat.opacity = 0.38 * fermWeight;
    }
  }

  updatePlanes(planesWeight, dt);

  if (sceneState.monolithGroup) {
    const visible = planesWeight > 0.008;
    sceneState.monolithGroup.visible = visible;
    if (visible) {
      if (state.motion) {
        sceneState.monolithGroup.rotation.z = Math.sin(state.time * 0.17) * 0.012;
        for (let i = 0; i < sceneState.monolithLines.length; i++) {
          const item = sceneState.monolithLines[i];
          item.line.position.y = item.baseY + Math.sin(state.time * 0.36 + item.seed * 1.4) * 0.08;
          item.line.rotation.z = item.baseRz + Math.sin(state.time * 0.25 + item.seed) * 0.018;
        }
      }
      if (sceneState.monolithMats) {
        for (let i = 0; i < sceneState.monolithMats.length; i++) {
          sceneState.monolithMats[i].opacity = 0.035 * planesWeight;
        }
      }
      if (sceneState.monolithLines) {
        for (let i = 0; i < sceneState.monolithLines.length; i++) {
          sceneState.monolithLines[i].lineMat.opacity = 0.28 * planesWeight;
        }
      }
    }
  }

  if (sceneState.pointsGroup) {
    const visible = pointsWeight > 0.004;
    sceneState.pointsGroup.visible = visible;
    if (visible) {
      const pu = sceneState.pointUniforms;
      pu.uTime.value = state.time;
      pu.uActive.value = state.activeCluster;
      pu.uOpacity.value = pointsWeight;
      pu.uMorph.value = m3;
      pu.uVelocity.value = state.velocitySmooth;
      pu.uBurst.value = state.burst;
      const s = sceneState.pointsGroup.scale.x || 1;
      pu.uPointer.value.set(
        (pointerWorldX - sceneState.pointsGroup.position.x) / s,
        (pointerWorldY - sceneState.pointsGroup.position.y) / s
      );

      const lu = sceneState.lineUniforms;
      if (lu) {
        lu.uTime.value = state.time;
        lu.uActive.value = state.activeCluster;
        lu.uOpacity.value = pointsWeight * (1 - m3 * 0.94);
        lu.uMorph.value = m3;
        lu.uVelocity.value = state.velocitySmooth;
        lu.uPointer.value.copy(pu.uPointer.value);
      }

      if (sceneState.pointerSprite) {
        const showSprite = finePointerQuery.matches && state.pointerMoved && m2 > 0.12 && m3 < 0.82;
        sceneState.pointerSprite.visible = showSprite;
        if (showSprite) {
          sceneState.pointerSprite.position.set(
            (pointerWorldX - sceneState.pointsGroup.position.x) / s,
            (pointerWorldY - sceneState.pointsGroup.position.y) / s,
            0.7
          );
          const pulse = 0.52 + Math.sin(state.time * 2.3) * 0.03 + state.burst * 0.18;
          sceneState.pointerSprite.scale.set(pulse, pulse, 1);
          sceneState.pointerSpriteMat.opacity = 0.75 * pointsWeight * (1 - m3);
        }
      }

      if (state.motion) sceneState.pointsGroup.rotation.z += dt * 0.008;
    }
  }

  if (sceneState.ringGroup) {
    const visible = portalGate > 0.004;
    sceneState.ringGroup.visible = visible;
    if (sceneState.gridMesh) sceneState.gridMesh.visible = gridGate > 0.004;
    if (visible) {
      const baseScale = mobileQuery.matches ? 0.74 : 1;
      sceneState.ringGroup.position.set(mobileQuery.matches ? 0 : 1.2, mobileQuery.matches ? -0.1 : 0.12, 0);
      sceneState.ringGroup.scale.setScalar(baseScale * (1 + state.burst * 0.06));
      const targetRX = state.pointerNY * 0.13;
      const targetRY = state.pointerNX * 0.17;
      sceneState.ringGroup.rotation.x = damp(sceneState.ringGroup.rotation.x, targetRX, 2.6, dt);
      sceneState.ringGroup.rotation.y = damp(sceneState.ringGroup.rotation.y, targetRY, 2.6, dt);

      sceneState.ringUniforms.uTime.value = state.time;
      sceneState.ringUniforms.uOpacity.value = portalGate;
      if (sceneState.vortexMesh && state.motion) sceneState.vortexMesh.rotation.z += dt * 0.045;
      if (sceneState.ringMats) {
        for (let i = 0; i < sceneState.ringMats.length; i++) {
          const item = sceneState.ringMats[i];
          item.mat.opacity = item.baseOpacity * portalGate;
          if (state.motion) item.mesh.rotation.z += dt * item.mesh.userData.speed * 0.4;
        }
      }
      if (sceneState.shardMat) sceneState.shardMat.opacity = 0.55 * portalGate;
      if (sceneState.shardGroup && state.motion) sceneState.shardGroup.rotation.z += dt * 0.07;

      if (gridGate > 0.004) {
        sceneState.gridUniforms.uTime.value = state.time;
        sceneState.gridUniforms.uOpacity.value = gridGate;
        sceneState.gridUniforms.uPointer.value.set(state.pointerSmoothX * 1.615, state.pointerSmoothY);
        if (sceneState.gridUniforms.uRipple) {
          sceneState.gridUniforms.uRipple.value = clamp(state.burst + Math.abs(state.velocitySmooth) * 0.4, 0, 1.5);
        }
        sceneState.gridUniforms.uAspect.value = 44 / 28;
      }
    }
  }

  if (sceneState.fx) {
    sceneState.fx.uniforms.uTime.value = state.time;
    sceneState.fx.uniforms.uVelocity.value = state.velocitySmooth;
    const vignette = lerp(0.5, 0.12, m1) * (1 - m2) + 0.5 * m2 * (1 - m3) + 0.34 * m3;
    sceneState.fx.uniforms.uVignette.value = clamp(vignette, 0, 0.6);
    sceneState.fx.uniforms.uGrain.value = 0.03 + m1 * 0.012;
  }
  if (sceneState.bloom) {
    const bloom = lerp(0.46, 0.07, m1) * (1 - m2) + 0.22 * m2 * (1 - m3) + 0.24 * m3;
    sceneState.bloom.strength = bloom;
  }
}
