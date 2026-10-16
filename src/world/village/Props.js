/**
 * src/world/village/Props.js
 * Lantern, pots, feature stones, broom — small details that bring life.
 */

import * as THREE      from 'three';
import { randomFloat } from '../../utils/MathUtils.js';
import { LIGHTING, DEBUG } from '../../utils/Constants.js';

export class Props {
  constructor(root, options = {}) {
    this._root       = root;
    this._opts       = options;
    this._materials  = options.materials  ?? new Set();
    this._geometries = options.geometries ?? new Set();
    this._lowEnd     = options.isLowEnd   ?? false;
    this.lanternGroup = null;
  }

  build() {
    this._buildLantern();
    this._buildPots();
    if (!this._lowEnd) { this._buildFeatureStones(); this._buildBroom(); }
    if (DEBUG.ENABLED) console.log('[Props] built');
  }

  destroy() {}

  _buildLantern() {
    const pos = this._opts.lanternPosition ?? new THREE.Vector3(-2,5.5,-1);
    this.lanternGroup = new THREE.Group(); this.lanternGroup.name = 'LanternGroup';
    this.lanternGroup.position.copy(pos);

    const ropeMat  = this._mat(0x8B6040, 0.98);
    const bodyMat  = this._mat(0x3A3020, 0.7);
    const glassMat = new THREE.MeshStandardMaterial({
      color:0xFF9A3C, emissive:new THREE.Color(0xFF9A3C), emissiveIntensity:0.8,
      roughness:0.2, transparent:true, opacity:0.85,
    });
    this._materials.add(glassMat);

    const ropeGeo = new THREE.CylinderGeometry(0.015,0.015,0.5,4); this._geometries.add(ropeGeo);
    const rope = new THREE.Mesh(ropeGeo, ropeMat); rope.position.y=0.25; this.lanternGroup.add(rope);

    const bodyGeo = new THREE.CylinderGeometry(0.14,0.14,0.32,8); this._geometries.add(bodyGeo);
    const body = new THREE.Mesh(bodyGeo, bodyMat); body.castShadow=true; this.lanternGroup.add(body);

    const glassGeo = new THREE.CylinderGeometry(0.10,0.10,0.26,8); this._geometries.add(glassGeo);
    const glass = new THREE.Mesh(glassGeo, glassMat); this.lanternGroup.add(glass);

    const capGeo = new THREE.ConeGeometry(0.16,0.12,8); this._geometries.add(capGeo);
    const cap = new THREE.Mesh(capGeo, bodyMat); cap.position.y=0.22; this.lanternGroup.add(cap);

    this._root.add(this.lanternGroup);
  }

  _buildPots() {
    const positions = this._opts.pots ?? [];
    if (!positions.length) return;
    const potMat  = this._mat(0xC46020, 0.85);
    const darkMat = this._mat(0x8B3E10, 0.9);
    const configs = [{rBot:0.18,rTop:0.14,h:0.38,mat:potMat},{rBot:0.14,rTop:0.11,h:0.30,mat:darkMat},{rBot:0.22,rTop:0.16,h:0.45,mat:potMat}];
    positions.forEach((pos, i) => {
      const c = configs[i % configs.length];
      const geo = new THREE.CylinderGeometry(c.rTop,c.rBot,c.h,10); this._geometries.add(geo);
      const pot = new THREE.Mesh(geo, c.mat); pot.position.copy(pos); pot.position.y=c.h/2;
      pot.castShadow=true; pot.receiveShadow=true; this._root.add(pot);
    });
  }

  _buildFeatureStones() {
    const mat = this._mat(0x7A7060, 0.88);
    const stones = [
      {pos:new THREE.Vector3(-6.5,0.12,-7.5), scale:new THREE.Vector3(0.4,0.25,0.35)},
      {pos:new THREE.Vector3(-9.0,0.08,-8.5), scale:new THREE.Vector3(0.28,0.18,0.22)},
      {pos:new THREE.Vector3(-7.5,0.10,-9.0), scale:new THREE.Vector3(0.35,0.20,0.30)},
    ];
    const geo = new THREE.DodecahedronGeometry(0.5,1); this._geometries.add(geo);
    for (const s of stones) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(s.pos); mesh.scale.copy(s.scale);
      mesh.rotation.set(randomFloat(0,Math.PI),randomFloat(0,Math.PI),randomFloat(0,Math.PI));
      mesh.castShadow=true; mesh.receiveShadow=true; this._root.add(mesh);
    }
  }

  _buildBroom() {
    const group = new THREE.Group(); group.name='Broom';
    group.position.set(14.5,0,-17.2); group.rotation.z=-0.25;
    const stickGeo = new THREE.CylinderGeometry(0.025,0.025,1.4,5); this._geometries.add(stickGeo);
    const stickMat = this._mat(0x8B6040, 0.9);
    const stick = new THREE.Mesh(stickGeo, stickMat); stick.position.y=0.7; group.add(stick);
    const headGeo = new THREE.ConeGeometry(0.12,0.35,8); this._geometries.add(headGeo);
    const headMat = this._mat(0xC8A050, 0.95);
    const head = new THREE.Mesh(headGeo, headMat); head.position.y=0.17; head.rotation.z=0.15; group.add(head);
    this._root.add(group);
  }

  _mat(color, roughness=0.9) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness:0 });
    this._materials.add(m); return m;
  }
}
