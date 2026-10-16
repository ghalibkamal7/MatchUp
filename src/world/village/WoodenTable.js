/**
 * src/world/village/WoodenTable.js
 * Game table — the focal point of all gameplay.
 */

import * as THREE      from 'three';
import { CARD, TABLE, DEBUG } from '../../utils/Constants.js';

const CFG = Object.freeze({
  TOP_W: TABLE.WIDTH, TOP_D: TABLE.DEPTH, TOP_THICK: TABLE.THICKNESS,
  LEG_W: 0.12, LEG_H: TABLE.LEG_HEIGHT, LEG_INSET_X: 0.25, LEG_INSET_Z: 0.45,
  BRACE_H: 0.08, BRACE_Y: 0.6, TABLE_Y: TABLE.POSITION.y,
});

export class WoodenTable {
  constructor(root, options = {}) {
    this._root       = root;
    this._position   = options.position   ?? new THREE.Vector3(0,0,0);
    this._lowEnd     = options.isLowEnd   ?? false;
    this._materials  = options.materials  ?? new Set();
    this._geometries = options.geometries ?? new Set();
    this._group      = new THREE.Group();
    this._group.name = 'WoodenTable';
    this.looseCard   = null;
  }

  build() {
    this._group.position.copy(this._position);
    this._group.position.y = CFG.TABLE_Y;
    this._buildTop();
    this._buildLegs();
    this._buildBraces();
    this._buildLooseCard();
    this._root.add(this._group);
    if (DEBUG.ENABLED) console.log('[WoodenTable] built');
  }

  get surfaceY()    { return CFG.TABLE_Y + CFG.TOP_THICK/2; }
  get pilePosition(){ return new THREE.Vector3(this._position.x, this.surfaceY, this._position.z); }
  get p1CardOrigin(){ return new THREE.Vector3(this._position.x, this.surfaceY, this._position.z + CFG.TOP_D*0.28); }
  get p2CardOrigin(){ return new THREE.Vector3(this._position.x, this.surfaceY, this._position.z - CFG.TOP_D*0.28); }

  update() {} destroy() {}

  _buildTop() {
    const geo = new THREE.BoxGeometry(CFG.TOP_W, CFG.TOP_THICK, CFG.TOP_D);
    this._geometries.add(geo);
    const mat = new THREE.MeshStandardMaterial({ color:0x7A5230, roughness:0.8, metalness:0.05 });
    this._materials.add(mat);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'Tabletop'; mesh.position.y = CFG.LEG_H + CFG.TOP_THICK/2;
    mesh.castShadow = true; mesh.receiveShadow = true;
    this._group.add(mesh);
  }

  _buildLegs() {
    const geo = new THREE.BoxGeometry(CFG.LEG_W, CFG.LEG_H, CFG.LEG_W);
    this._geometries.add(geo);
    const mat = new THREE.MeshStandardMaterial({ color:0x6A4828, roughness:0.9 });
    this._materials.add(mat);
    const ix = CFG.TOP_W/2 - CFG.LEG_INSET_X;
    const iz = CFG.TOP_D/2 - CFG.LEG_INSET_Z;
    for (const [x,z] of [[ix,iz],[-ix,iz],[ix,-iz],[-ix,-iz]]) {
      const leg = new THREE.Mesh(geo, mat);
      leg.position.set(x, CFG.LEG_H/2, z); leg.castShadow = true;
      this._group.add(leg);
    }
  }

  _buildBraces() {
    const mat = new THREE.MeshStandardMaterial({ color:0x4A2F18, roughness:0.92 });
    this._materials.add(mat);
    for (const [bw,bh,bd] of [[CFG.TOP_W-CFG.LEG_INSET_X*2, CFG.BRACE_H, CFG.LEG_W],[CFG.LEG_W, CFG.BRACE_H, CFG.TOP_D-CFG.LEG_INSET_Z*2]]) {
      const geo  = new THREE.BoxGeometry(bw, bh, bd);
      this._geometries.add(geo);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = CFG.BRACE_Y; mesh.castShadow = true;
      this._group.add(mesh);
    }
  }

  _buildLooseCard() {
    const geo = new THREE.BoxGeometry(CARD.WIDTH, CARD.DEPTH, CARD.HEIGHT);
    this._geometries.add(geo);
    const mat = new THREE.MeshStandardMaterial({ color:0xF5E6C8, roughness:0.7 });
    this._materials.add(mat);
    this.looseCard = new THREE.Mesh(geo, mat);
    this.looseCard.name = 'LooseCard';
    this.looseCard.position.set(0.6, CFG.LEG_H + CFG.TOP_THICK/2 + CARD.DEPTH/2, 0.8);
    this.looseCard.rotation.y = 0.3; this.looseCard.castShadow = true;
    this._group.add(this.looseCard);
  }
}
