/**
 * src/world/village/BanyanTree.js
 * Banyan tree — trunk, aerial roots, branches, instanced leaf canopy with wind.
 */

import * as THREE      from 'three';
import { randomFloat } from '../../utils/MathUtils.js';
import { ATMOSPHERE, DEBUG } from '../../utils/Constants.js';

const CFG = Object.freeze({
  TRUNK_R_BOT:4, TRUNK_R_TOP:0.45, TRUNK_H:6.5, TRUNK_SEG:8,
  BRANCHES: [[20,3.8,0.28,0.82],[-30,4.2,0.25,0.78],[60,3.2,0.22,0.88],[-70,3.5,0.20,0.85],[140,3.0,0.18,0.80],[-150,2.8,0.16,0.75]],
  ROOT_COUNT:8, ROOT_R:0.04, ROOT_H_MIN:2.0, ROOT_H_MAX:4.5, ROOT_SPREAD:3.5,
  LEAF_COUNT_HIGH:220, LEAF_COUNT_LOW:80,
  LEAF_SIZE_MIN:0.55, LEAF_SIZE_MAX:1.10,
  LEAF_SPREAD_X:4.5, LEAF_SPREAD_Y:3.0, LEAF_SPREAD_Z:4.5, LEAF_Y_BASE:5.5,
  LEAF_SWAY_MAX:0.12, LEAF_SWAY_SPEED:0.8,
});

export class BanyanTree {
  constructor(root, options = {}) {
    this._root       = root;
    this._position   = options.position   ?? new THREE.Vector3(-8,0,-10);
    this._lowEnd     = options.isLowEnd   ?? false;
    this._materials  = options.materials  ?? new Set();
    this._geometries = options.geometries ?? new Set();
    this._treeGroup  = new THREE.Group();
    this._treeGroup.name = 'BanyanTree';
    this._leafMesh   = null;
    this._leafPhaseOffsets = [];
    this._leafData   = [];
    this._dummy      = new THREE.Object3D();
  }

  build() {
    this._treeGroup.position.copy(this._position);
    this._buildTrunk();
    this._buildBranches();
    if (!this._lowEnd) this._buildAerialRoots();
    this._buildLeafCanopy();
    this._root.add(this._treeGroup);
    if (DEBUG.ENABLED) console.log('[BanyanTree] built');
  }

  update(delta, elapsed, windPhase) {
    if (!this._leafMesh || !this._leafData.length) return;
    for (let i = 0; i < this._leafData.length; i++) {
      const ld    = this._leafData[i];
      const phase = windPhase * CFG.LEAF_SWAY_SPEED + this._leafPhaseOffsets[i];
      this._dummy.position.set(ld.x, ld.y, ld.z);
      this._dummy.rotation.set(Math.sin(phase)*CFG.LEAF_SWAY_MAX, ld.ry, Math.cos(phase*0.7)*CFG.LEAF_SWAY_MAX*0.5);
      this._dummy.scale.setScalar(ld.scale);
      this._dummy.updateMatrix();
      this._leafMesh.setMatrixAt(i, this._dummy.matrix);
    }
    this._leafMesh.instanceMatrix.needsUpdate = true;
  }

  destroy() {}

  _buildTrunk() {
    const geo = new THREE.CylinderGeometry(CFG.TRUNK_R_TOP, CFG.TRUNK_R_BOT, CFG.TRUNK_H, CFG.TRUNK_SEG);
    this._geometries.add(geo);
    this._distort(geo, 0.06);
    const mat = new THREE.MeshStandardMaterial({ color:0x5C3A1E, roughness:0.95 });
    this._materials.add(mat);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'Trunk'; mesh.position.y = CFG.TRUNK_H/2;
    mesh.castShadow = true; mesh.receiveShadow = true;
    this._treeGroup.add(mesh);
  }

  _buildBranches() {
    const mat = new THREE.MeshStandardMaterial({ color:0x3D2410, roughness:0.95 });
    this._materials.add(mat);
    for (const [angleDeg, length, radius, hFrac] of CFG.BRANCHES) {
      const geo = new THREE.CylinderGeometry(radius*0.5, radius, length, 6);
      this._geometries.add(geo); this._distort(geo, 0.04);
      const b = new THREE.Mesh(geo, mat);
      const a = (angleDeg * Math.PI) / 180;
      b.rotation.z = a + Math.PI*0.15;
      b.position.set(Math.cos(a)*0.8, CFG.TRUNK_H*hFrac, Math.sin(a)*0.8);
      b.castShadow = true; b.name = 'Branch';
      this._treeGroup.add(b);
    }
  }

  _buildAerialRoots() {
    const mat = new THREE.MeshStandardMaterial({ color:0x5C3A1E, roughness:0.98 });
    this._materials.add(mat);
    for (let i = 0; i < CFG.ROOT_COUNT; i++) {
      const h   = randomFloat(CFG.ROOT_H_MIN, CFG.ROOT_H_MAX);
      const geo = new THREE.CylinderGeometry(CFG.ROOT_R, CFG.ROOT_R*1.5, h, 4);
      this._geometries.add(geo);
      const a   = (i / CFG.ROOT_COUNT) * Math.PI*2 + randomFloat(-0.3,0.3);
      const sp  = randomFloat(1.2, CFG.ROOT_SPREAD);
      const r   = new THREE.Mesh(geo, mat);
      r.position.set(Math.cos(a)*sp, h/2+1.5, Math.sin(a)*sp);
      r.castShadow = true; r.name = 'AerialRoot';
      this._treeGroup.add(r);
    }
  }

  _buildLeafCanopy() {
    const count = this._lowEnd ? CFG.LEAF_COUNT_LOW : CFG.LEAF_COUNT_HIGH;
    const geo   = new THREE.CircleGeometry(0.5, this._lowEnd ? 5 : 7);
    this._geometries.add(geo);
    const mat = new THREE.MeshStandardMaterial({ color:0x2D6E1A, roughness:0.8, side:THREE.DoubleSide });
    this._materials.add(mat);
    this._leafMesh = new THREE.InstancedMesh(geo, mat, count);
    this._leafMesh.name = 'LeafCanopy'; this._leafMesh.castShadow = true;
    for (let i = 0; i < count; i++) {
      const x=randomFloat(-CFG.LEAF_SPREAD_X,CFG.LEAF_SPREAD_X);
      const y=CFG.LEAF_Y_BASE+randomFloat(0,CFG.LEAF_SPREAD_Y);
      const z=randomFloat(-CFG.LEAF_SPREAD_Z,CFG.LEAF_SPREAD_Z);
      const scale=randomFloat(CFG.LEAF_SIZE_MIN,CFG.LEAF_SIZE_MAX);
      const ry=randomFloat(0,Math.PI*2);
      this._leafData.push({x,y,z,scale,ry});
      this._leafPhaseOffsets.push(randomFloat(0,Math.PI*2));
      this._dummy.position.set(x,y,z); this._dummy.rotation.set(0,ry,0);
      this._dummy.scale.setScalar(scale); this._dummy.updateMatrix();
      this._leafMesh.setMatrixAt(i, this._dummy.matrix);
    }
    this._leafMesh.instanceMatrix.needsUpdate = true;
    this._treeGroup.add(this._leafMesh);
  }

  _distort(geo, amount) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, pos.getX(i) + randomFloat(-amount, amount));
      pos.setZ(i, pos.getZ(i) + randomFloat(-amount, amount));
    }
    pos.needsUpdate = true; geo.computeVertexNormals();
  }
}
