import { palette, rgbCss } from '../core/color.js';
import { sceneState } from './scene-state.js';

export function syncScenePalette() {
  if (!sceneState.scene) return;
  const ink = rgbCss(palette.ink);
  const accent = rgbCss(palette.accent);
  const bg = rgbCss(palette.bg);

  if (sceneState.scene.background) sceneState.scene.background.setStyle(bg);
  if (sceneState.renderer) sceneState.renderer.setClearColor(bg, 1);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', bg);

  if (sceneState.fermUniforms) {
    sceneState.fermUniforms.uInk.value.setStyle(ink);
    sceneState.fermUniforms.uAccent.value.setStyle(accent);
  }
  if (sceneState.fermWireMat) sceneState.fermWireMat.color.setStyle(accent);
  if (sceneState.fermRingMats) sceneState.fermRingMats.forEach((m) => m.color.setStyle(accent));
  if (sceneState.dustMat) sceneState.dustMat.color.setStyle(ink);
  if (sceneState.monolithMats) sceneState.monolithMats.forEach((m) => m.color.setStyle(ink));
  if (sceneState.monolithLines) sceneState.monolithLines.forEach((m) => m.lineMat.color.setStyle(accent));
  if (sceneState.pointUniforms) sceneState.pointUniforms.uInk.value.setStyle(ink);
  if (sceneState.lineUniforms) sceneState.lineUniforms.uInk.value.setStyle(ink);
  if (sceneState.ringMats) sceneState.ringMats.forEach((r) => r.mat.color.setStyle(ink));
  if (sceneState.shardMat) sceneState.shardMat.color.setStyle(ink);
  if (sceneState.gridUniforms) {
    sceneState.gridUniforms.uInk.value.setStyle(ink);
    if (sceneState.gridUniforms.uAccent) sceneState.gridUniforms.uAccent.value.setStyle(accent);
  }
  if (sceneState.ringUniforms) {
    sceneState.ringUniforms.uInk.value.setStyle(ink);
    sceneState.ringUniforms.uAccent.value.setStyle(accent);
  }
}
