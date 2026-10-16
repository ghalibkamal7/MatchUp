/**
 * src/world/village/Structures.js
 * Orchestrates all man-made structures — table, chairs, tea stall, houses.
 */

import * as THREE        from 'three';
import { WoodenTable }   from './WoodenTable.js';
import { WoodenChair }   from './WoodenChair.js';
import { randomFloat }   from '../../utils/MathUtils.js';
import { DEBUG }         from '../../utils/Constants.js';

export class Structures {
  constructor(root, options = {}) {
    this._root       = root;
    this._opts       = options;
    this._materials  = options.materials  ?? new Set();
    this._geometries = options.geometries ?? new Set();
    this._lowEnd     = options.isLowEnd   ?? false;
    this.looseCard   = null;
    this.tableRef    = null;
    this._clothMeshes = [];
  }

  build() {
    this._buildTable();
    this._buildChairs();
    this._buildTeaStall();
    this._buildMudHouses();
    if (!this._lowEnd) this._buildFencePosts();
    if (DEBUG.ENABLED) console.log('[Structures] built');
  }

  update(_delta, _elapsed, windPhase) {
    for (const cloth of this._clothMeshes) {
      cloth.rotation.x = Math.sin(windPhase*0.9 + cloth.userData.phase) * 0.06;
      cloth.rotation.z = Math.cos(windPhase*0.7 + cloth.userData.phase) * 0.03;
    }
  }

  destroy() {}

  _buildTable() {
    this.tableRef = new WoodenTable(this._root, {
      position: this._opts.tablePosition, isLowEnd: this._lowEnd,
      materials: this._materials, geometries: this._geometries,
    });
    this.tableRef.build();
    this.looseCard = this.tableRef.looseCard;
  }

  _buildChairs() {
    new WoodenChair(this._root, { position: this._opts.chairP1, rotationY: Math.PI, isLowEnd: this._lowEnd, materials: this._materials, geometries: this._geometries }).build();
    new WoodenChair(this._root, { position: this._opts.chairP2, rotationY: 0,       isLowEnd: this._lowEnd, materials: this._materials, geometries: this._geometries }).build();
  }

  _buildTeaStall() {
    const pos   = this._opts.teaStall ?? new THREE.Vector3(12,0,-18);
    const group = new THREE.Group(); group.name = 'TeaStall'; group.position.copy(pos);
    const postMat  = this._mat(0x6B4226, 0.9);
    const roofMat  = this._mat(0xC8A040, 0.95);
    const wallMat  = this._mat(0xC4A882, 0.90);
    const clothMat = new THREE.MeshStandardMaterial({ color:0xE8C87A, roughness:0.85, side:THREE.DoubleSide });
    this._materials.add(clothMat);

    const postGeo = new THREE.BoxGeometry(0.12,2.8,0.12); this._geometries.add(postGeo);
    for (const [x,z] of [[-1.4,0],[1.4,0],[-1.4,-1.8],[1.4,-1.8]]) {
      const p = new THREE.Mesh(postGeo, postMat); p.position.set(x,1.4,z); p.castShadow=true; group.add(p);
    }
    const roofGeo = new THREE.BoxGeometry(3.2,0.12,2.2); this._geometries.add(roofGeo);
    const roof = new THREE.Mesh(roofGeo, roofMat); roof.position.y=2.8; roof.castShadow=true; group.add(roof);
    const wallGeo = new THREE.BoxGeometry(3.0,2.0,0.1); this._geometries.add(wallGeo);
    const wall = new THREE.Mesh(wallGeo, wallMat); wall.position.set(0,1.0,-1.8); wall.castShadow=true; group.add(wall);
    const clothGeo = new THREE.PlaneGeometry(2.6,0.8,1,3); this._geometries.add(clothGeo);
    const cloth = new THREE.Mesh(clothGeo, clothMat); cloth.position.set(0,2.4,0.05);
    cloth.userData.phase = randomFloat(0, Math.PI); group.add(cloth); this._clothMeshes.push(cloth);
    this._root.add(group);
  }

  _buildMudHouses() {
    const positions = this._opts.houses ?? [];
    if (!positions.length) return;
    const wallMat   = this._mat(0xC4A882, 0.92);
    const darkMat   = this._mat(0xA08060, 0.95);
    const thatchMat = this._mat(0x8B6820, 0.95);
    const sizes     = [{w:3.5,h:2.4,d:2.8},{w:4.0,h:2.8,d:3.2},{w:3.0,h:2.2,d:2.5},{w:3.8,h:2.6,d:3.0}];
    positions.forEach((pos, i) => {
      const sz    = sizes[i % sizes.length];
      const group = new THREE.Group(); group.name = `MudHouse_${i}`; group.position.copy(pos);
      group.rotation.y = randomFloat(-0.2, 0.2);
      const bodyGeo = new THREE.BoxGeometry(sz.w, sz.h, sz.d); this._geometries.add(bodyGeo);
      const body = new THREE.Mesh(bodyGeo, wallMat); body.position.y = sz.h/2; body.castShadow=true; body.receiveShadow=true; group.add(body);
      const roofGeo = new THREE.ConeGeometry(Math.max(sz.w,sz.d)*0.75, sz.h*0.6, 4); this._geometries.add(roofGeo);
      const roof = new THREE.Mesh(roofGeo, thatchMat); roof.position.y = sz.h+sz.h*0.3; roof.rotation.y=Math.PI/4; roof.castShadow=true; group.add(roof);
      if (!this._lowEnd) {
        const doorGeo = new THREE.BoxGeometry(0.55,1.4,0.12); this._geometries.add(doorGeo);
        const door = new THREE.Mesh(doorGeo, darkMat); door.position.set(0,0.7,sz.d/2+0.01); group.add(door);
      }
      this._root.add(group);
    });
  }

  _buildFencePosts() {
    const mat     = this._mat(0x8B6040, 0.92);
    const postGeo = new THREE.CylinderGeometry(0.04,0.05,1.1,5); this._geometries.add(postGeo);
    for (let i = 0; i < 12; i++) {
      const post = new THREE.Mesh(postGeo, mat); post.position.set(-8+i*1.4, 0.55, -7); post.castShadow=true; this._root.add(post);
    }
  }

  _mat(color, roughness=0.9) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness:0 });
    this._materials.add(m); return m;
  }
}
