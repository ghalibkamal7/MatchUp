/**
 * src/world/village/WoodenChair.js
 * Reusable chair builder — instantiated twice (P1 + P2).
 */

import * as THREE from 'three';
import { DEBUG }  from '../../utils/Constants.js';

const CFG = Object.freeze({
  SEAT_W:0.85, SEAT_D:0.80, SEAT_H:0.06, SEAT_Y:1.00,
  LEG_W:0.06, LEG_H:1.00, LEG_INSET:0.08,
  BACK_W:0.82, BACK_H:0.65, BACK_Y_OFFSET:0.30,
  SLAT_COUNT:3, SLAT_H:0.06, SLAT_GAP:0.12,
  RUNG_Y:0.35,
});

export class WoodenChair {
  constructor(root, options = {}) {
    this._root       = root;
    this._position   = options.position   ?? new THREE.Vector3(0,0,3.5);
    this._rotationY  = options.rotationY  ?? 0;
    this._lowEnd     = options.isLowEnd   ?? false;
    this._materials  = options.materials  ?? new Set();
    this._geometries = options.geometries ?? new Set();
    this._group      = new THREE.Group();
    this._group.name = 'WoodenChair';
  }

  build() {
    this._group.position.copy(this._position);
    this._group.rotation.y = this._rotationY;
    const woodMat = this._mat(0x6B4226);
    const darkMat = this._mat(0x4A2D18);
    this._buildSeat(woodMat);
    this._buildLegs(darkMat);
    this._buildBackRest(woodMat, darkMat);
    this._buildFrontRung(darkMat);
    this._root.add(this._group);
    if (DEBUG.ENABLED) console.log('[WoodenChair] built');
  }

  destroy() {}

  _buildSeat(mat) {
    const geo = new THREE.BoxGeometry(CFG.SEAT_W, CFG.SEAT_H, CFG.SEAT_D);
    this._geometries.add(geo);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = CFG.SEAT_Y; mesh.castShadow = true; mesh.receiveShadow = true;
    this._group.add(mesh);
  }

  _buildLegs(mat) {
    const geo = new THREE.BoxGeometry(CFG.LEG_W, CFG.LEG_H, CFG.LEG_W);
    this._geometries.add(geo);
    const ix = CFG.SEAT_W/2 - CFG.LEG_INSET, iz = CFG.SEAT_D/2 - CFG.LEG_INSET;
    for (const [x,z] of [[ix,iz],[-ix,iz],[ix,-iz],[-ix,-iz]]) {
      const leg = new THREE.Mesh(geo, mat);
      leg.position.set(x, CFG.LEG_H/2, z); leg.castShadow = true;
      this._group.add(leg);
    }
  }

  _buildBackRest(mat, slatMat) {
    const bz      = -(CFG.SEAT_D/2);
    const postGeo = new THREE.BoxGeometry(CFG.LEG_W, CFG.BACK_H, CFG.LEG_W);
    this._geometries.add(postGeo);
    for (const side of [-1,1]) {
      const post = new THREE.Mesh(postGeo, mat);
      post.position.set(side*(CFG.BACK_W/2-CFG.LEG_W/2), CFG.SEAT_Y+CFG.BACK_H/2, bz);
      post.castShadow = true; this._group.add(post);
    }
    if (!this._lowEnd) {
      const slatGeo = new THREE.BoxGeometry(CFG.BACK_W-CFG.LEG_W*2, CFG.SLAT_H, 0.05);
      this._geometries.add(slatGeo);
      for (let i = 0; i < CFG.SLAT_COUNT; i++) {
        const slat = new THREE.Mesh(slatGeo, slatMat);
        slat.position.set(0, CFG.SEAT_Y+CFG.BACK_Y_OFFSET+i*(CFG.SLAT_H+CFG.SLAT_GAP), bz);
        slat.castShadow = true; this._group.add(slat);
      }
    }
  }

  _buildFrontRung(mat) {
    const geo = new THREE.BoxGeometry(CFG.SEAT_W-CFG.LEG_INSET*2, CFG.LEG_W*0.8, CFG.LEG_W*0.8);
    this._geometries.add(geo);
    const rung = new THREE.Mesh(geo, mat);
    rung.position.set(0, CFG.RUNG_Y, CFG.SEAT_D/2-CFG.LEG_INSET);
    rung.castShadow = true; this._group.add(rung);
  }

  _mat(color) {
    const m = new THREE.MeshStandardMaterial({ color, roughness:0.88, metalness:0 });
    this._materials.add(m); return m;
  }
}
