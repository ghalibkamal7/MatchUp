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
    this._playerBodies = [];
  }

  build() {
    this._buildCourtyardWall();
    this._buildSeatedPlayers();
    this._buildTeaStall();
    this._buildMudHouses();
    if (!this._lowEnd) this._buildFencePosts();
    if (DEBUG.ENABLED) console.log('[Structures] built');
  }

  update(_delta, elapsed, windPhase) {
    for (const cloth of this._clothMeshes) {
      cloth.rotation.x = Math.sin(windPhase*0.9 + cloth.userData.phase) * 0.06;
      cloth.rotation.z = Math.cos(windPhase*0.7 + cloth.userData.phase) * 0.03;
    }
    for (const { torso, phase } of this._playerBodies) {
      torso.rotation.x = -0.12 + Math.sin(elapsed * 1.3 + phase) * 0.012;
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

  _buildCourtyardWall() {
    const wallMat = this._makePlasterMaterial();
    const baseMat = this._mat(0x92775f, 0.98);
    const woodMat = this._mat(0x684631, 0.9);
    const wallGeo = new THREE.BoxGeometry(42, 4.4, 0.48);
    this._geometries.add(wallGeo);
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.name = 'CourtyardWall';
    wall.position.set(0, 2.2, -13.5);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this._root.add(wall);

    const baseGeo = new THREE.BoxGeometry(42, 0.36, 0.62);
    this._geometries.add(baseGeo);
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, 0.18, -13.42);
    base.castShadow = true;
    base.receiveShadow = true;
    this._root.add(base);

    const doorGeo = new THREE.BoxGeometry(1.35, 2.55, 0.1);
    this._geometries.add(doorGeo);
    const door = new THREE.Mesh(doorGeo, woodMat);
    door.name = 'CourtyardDoor';
    door.position.set(8.5, 1.63, -13.22);
    door.castShadow = true;
    this._root.add(door);

    const frameGeo = new THREE.BoxGeometry(0.14, 2.7, 0.14);
    const lintelGeo = new THREE.BoxGeometry(1.55, 0.16, 0.14);
    this._geometries.add(frameGeo);
    this._geometries.add(lintelGeo);
    for (const x of [7.82, 9.18]) {
      const frame = new THREE.Mesh(frameGeo, baseMat);
      frame.position.set(x, 1.62, -13.13);
      this._root.add(frame);
    }
    const lintel = new THREE.Mesh(lintelGeo, baseMat);
    lintel.position.set(8.5, 2.96, -13.13);
    this._root.add(lintel);

    const windowGeo = new THREE.BoxGeometry(1.1, 0.85, 0.08);
    const shutterGeo = new THREE.BoxGeometry(0.12, 1.02, 0.12);
    this._geometries.add(windowGeo);
    this._geometries.add(shutterGeo);
    const windowMat = this._mat(0x615344, 0.9);
    for (const x of [-8.5, 1.5]) {
      const window = new THREE.Mesh(windowGeo, windowMat);
      window.position.set(x, 2.45, -13.19);
      this._root.add(window);
      for (const side of [-1, 1]) {
        const shutter = new THREE.Mesh(shutterGeo, woodMat);
        shutter.position.set(x + side * 0.62, 2.45, -13.12);
        this._root.add(shutter);
      }
    }
  }

  _makePlasterMaterial() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#d0c0aa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 90; i++) {
      const x = (i * 193 + 17) % 512;
      const y = (i * 127 + 73) % 512;
      ctx.fillStyle = i % 2 ? 'rgba(111, 79, 53, 0.06)' : 'rgba(255, 244, 222, 0.12)';
      ctx.beginPath();
      ctx.ellipse(x, y, 4 + (i % 13), 2 + (i % 8), i * 0.37, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 2200; i++) {
      const x = (i * 193 + 17) % 512;
      const y = (i * 127 + 73) % 512;
      ctx.fillStyle = i % 2 ? 'rgba(87, 59, 39, 0.08)' : 'rgba(255, 237, 203, 0.13)';
      ctx.fillRect(x, y, 1 + (i % 4), 1);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 1);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({ map:texture, color:0xffffff, roughness:0.96 });
    this._materials.add(mat);
    return mat;
  }

  _buildSeatedPlayers() {
    const skinMats = [this._mat(0x9b6345, 0.9), this._mat(0xb47754, 0.9)];
    const hairMat = this._mat(0x25201d, 0.96);
    const eyeMat = this._mat(0x2a1d19, 0.8);
    const mouthMat = this._mat(0x74443a, 0.9);
    const shirtMats = [this._mat(0x356b70, 0.88), this._mat(0xd08b45, 0.9)];
    const pantsMats = [this._mat(0x39485c, 0.94), this._mat(0x665149, 0.94)];
    const cushionMats = [this._mat(0xa75d3b, 0.94), this._mat(0x63715b, 0.94)];
    const sphereGeo = new THREE.SphereGeometry(1, 14, 10);
    const limbGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
    const cushionGeo = new THREE.BoxGeometry(1.7, 0.28, 1.65);
    const buttonGeo = new THREE.SphereGeometry(0.035, 6, 4);
    this._geometries.add(sphereGeo);
    this._geometries.add(limbGeo);
    this._geometries.add(cushionGeo);
    this._geometries.add(buttonGeo);

    const makeEllipsoid = (parent, position, scale, material, geometry = sphereGeo) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const makeSegment = (parent, a, b, radius, material) => {
      const start = new THREE.Vector3(...a);
      const end = new THREE.Vector3(...b);
      const direction = end.clone().sub(start);
      const mesh = new THREE.Mesh(limbGeo, material);
      mesh.position.copy(start).add(end).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
      mesh.scale.set(radius, direction.length(), radius);
      mesh.castShadow = true;
      parent.add(mesh);
      makeEllipsoid(parent, a, [radius, radius, radius], material);
      makeEllipsoid(parent, b, [radius, radius, radius], material);
    };

    [
      { x:-2.0, z:6.35, yaw:Math.PI, index:0 },
      { x: 2.0, z:-6.35, yaw:0,      index:1 },
    ].forEach(({ x, z, yaw, index }) => {
      const group = new THREE.Group();
      group.name = `SeatedPlayer_${index + 1}`;
      group.position.set(x, 0, z);
      group.rotation.y = yaw;

      const cushion = new THREE.Mesh(cushionGeo, cushionMats[index]);
      cushion.position.set(0, 0.17, -0.05);
      cushion.castShadow = true;
      cushion.receiveShadow = true;
      group.add(cushion);

      makeEllipsoid(group, [-0.36, 0.39, 0.32], [0.53, 0.2, 0.28], pantsMats[index]);
      makeEllipsoid(group, [ 0.36, 0.39, 0.32], [0.53, 0.2, 0.28], pantsMats[index]);
      const torso = makeEllipsoid(group, [0, 1.16, 0], [0.58, 0.82, 0.44], shirtMats[index]);
      torso.rotation.x = -0.12;
      this._playerBodies.push({ torso, phase:index * 1.4 });
      makeEllipsoid(group, [0, 1.98, 0.04], [0.42, 0.49, 0.4], skinMats[index]);
      makeEllipsoid(group, [0, 2.27, 0.02], [0.44, 0.27, 0.42], hairMat);
      makeEllipsoid(group, [0, 2.14, 0.37], [0.3, 0.13, 0.09], hairMat);
      makeEllipsoid(group, [0, 1.94, 0.44], [0.055, 0.07, 0.055], skinMats[index]);
      for (const eyeX of [-0.14, 0.14]) {
        makeEllipsoid(group, [eyeX, 2.02, 0.385], [0.043, 0.05, 0.035], eyeMat);
      }
      makeEllipsoid(group, [0, 1.81, 0.389], [0.1, 0.025, 0.018], mouthMat);
      for (const buttonY of [1.2, 1.02, 0.84]) {
        makeEllipsoid(group, [0, buttonY, 0.43], [1, 1, 1], cushionMats[index], buttonGeo);
      }

      for (const side of [-1, 1]) {
        const shoulder = [side * 0.43, 1.48, 0.02];
        const elbow = [side * 0.36, 0.91, 0.39];
        const wrist = [side * 0.24, 0.48, 0.86];
        makeSegment(group, shoulder, elbow, 0.14, shirtMats[index]);
        makeSegment(group, elbow, wrist, 0.11, skinMats[index]);
        makeEllipsoid(group, wrist, [0.16, 0.12, 0.2], skinMats[index]);
      }

      this._root.add(group);
    });
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
