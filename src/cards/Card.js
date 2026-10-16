/**
 * src/cards/Card.js
 * 3D card entity — data model + Three.js mesh + state.
 */

import * as THREE               from 'three';
import { CardTextureGenerator } from './CardTextureGenerator.js';
import { CARD }                 from '../utils/Constants.js';

export class Card {
  constructor(data) {
    this.id          = data.id;
    this.pictureID   = data.pictureID;
    this.label       = data.label;
    this.ownerID     = data.ownerID ?? null;
    this.isFaceUp    = false;
    this.isInPile    = false;
    this.isAnimating = false;
    this._mesh       = null;
    this._frontMat   = null;
    this._backMat    = null;
    this._built      = false;
  }

  build() {
    if (this._built) return this;
    const geo      = new THREE.BoxGeometry(CARD.WIDTH, CARD.DEPTH, CARD.HEIGHT);
    const frontTex = CardTextureGenerator.generateFront(this.pictureID, this.label);
    const backTex  = CardTextureGenerator.generateBack();
    this._frontMat = new THREE.MeshStandardMaterial({ map:frontTex, roughness:0.6, metalness:0 });
    this._backMat  = new THREE.MeshStandardMaterial({ map:backTex,  roughness:0.6, metalness:0 });
    const mats = [this._backMat, this._backMat, this._frontMat, this._backMat, this._backMat, this._backMat];
    this._mesh = new THREE.Mesh(geo, mats);
    this._mesh.name = `Card_${this.pictureID}_${this.id}`;
    this._mesh.castShadow = true; this._mesh.receiveShadow = true;
    this._mesh.userData.card = this;
    this._built = true;
    return this;
  }

  get mesh() { if (!this._built) this.build(); return this._mesh; }
  get position() { return this._mesh?.position ?? new THREE.Vector3(); }

  flipFaceUp()   { this.isFaceUp = true;  if (this._mesh) this._mesh.rotation.x = 0; }
  flipFaceDown() { this.isFaceUp = false; if (this._mesh) this._mesh.rotation.x = Math.PI; }

  setGlow(active, color = 0xffd700) {
    if (!this._frontMat) return;
    if (active) { this._frontMat.emissive = new THREE.Color(color); this._frontMat.emissiveIntensity = 0.4; }
    else        { this._frontMat.emissive = new THREE.Color(0x000000); this._frontMat.emissiveIntensity = 0; }
  }

  dispose() {
    this._mesh?.parent?.remove(this._mesh);
    this._mesh?.geometry.dispose();
    this._frontMat?.dispose();
    this._backMat?.dispose();
    this._mesh = null; this._built = false;
  }
}
