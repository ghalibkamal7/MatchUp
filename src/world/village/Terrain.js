/**
 * src/world/village/Terrain.js
 * Ground, road, grass patches, stones — the floor everything sits on.
 */

import * as THREE      from 'three';
import { randomFloat } from '../../utils/MathUtils.js';
import { DEBUG }       from '../../utils/Constants.js';

const CFG = Object.freeze({
  GROUND_SIZE: 200,
  ROAD_WIDTH: 3.2, ROAD_LENGTH: 24, ROAD_Z: -26, ROAD_Y: 0.005,
  PLAYFIELD_RADIUS: 9,
  GRASS: { COUNT_HIGH:400, COUNT_LOW:150, SPREAD_X:45, SPREAD_Z:45, SCALE_MIN:0.12, SCALE_MAX:0.28, Y:0.001 },
  STONES: { COUNT_HIGH:120, COUNT_LOW:40, SPREAD_X:35, SPREAD_Z:35, SCALE_MIN:0.04, SCALE_MAX:0.18 },
});

export class Terrain {
  constructor(root, options = {}) {
    this._root       = root;
    this._lowEnd     = options.isLowEnd    ?? false;
    this._materials  = options.materials   ?? new Set();
    this._geometries = options.geometries  ?? new Set();
  }

  build() {
    this._buildGround();
    this._buildRoad();
    this._buildGrassPatches();
    this._buildStones();
    if (DEBUG.ENABLED) console.log('[Terrain] built');
  }

  update() {}
  destroy() {}

  _buildGround() {
    const geo = new THREE.PlaneGeometry(CFG.GROUND_SIZE, CFG.GROUND_SIZE);
    this._geometries.add(geo);
    const texture = this._createStoneTexture();
    const mat = new THREE.MeshStandardMaterial({ map:texture, color:0xc9b9a2, roughness:0.96, metalness:0 });
    this._materials.add(mat);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'Ground'; mesh.rotation.x = -Math.PI/2;
    mesh.receiveShadow = true; mesh.castShadow = false;
    this._root.add(mesh);
  }

  _createStoneTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#887d70';
    ctx.fillRect(0, 0, size, size);

    const colors = ['#c8baa3', '#d0c1a8', '#bfb29e', '#cdbda4', '#c2b49f', '#d2c1a7'];
    const tile = 64;
    for (let row = 0; row < size / tile; row++) {
      const rowOffset = (row % 2) * (tile / 2);
      for (let col = -1; col <= size / tile; col++) {
        const seed = row * 37 + col * 19;
        const inset = 2 + (seed % 3);
        const x = col * tile + rowOffset + inset;
        const y = row * tile + inset;
        const w = tile - inset * 2;
        const h = tile - inset * 2;
        ctx.fillStyle = colors[seed % colors.length];
        ctx.beginPath();
        ctx.moveTo(x + (seed % 7), y);
        ctx.lineTo(x + w - (seed % 5), y + 2);
        ctx.lineTo(x + w, y + h - (seed % 6));
        ctx.lineTo(x + 2, y + h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(65, 54, 46, 0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    for (let i = 0; i < 1800; i++) {
      const x = (i * 197 + 31) % size;
      const y = (i * 131 + 89) % size;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(68, 58, 50, 0.12)' : 'rgba(245, 229, 204, 0.12)';
      ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(32, 32);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }

  _buildRoad() {
    const geo = new THREE.PlaneGeometry(CFG.ROAD_WIDTH, CFG.ROAD_LENGTH);
    this._geometries.add(geo);
    const mat = new THREE.MeshStandardMaterial({ color:0x8b7966, roughness:0.98, metalness:0 });
    this._materials.add(mat);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'Road'; mesh.rotation.x = -Math.PI/2; mesh.rotation.z = Math.PI/2;
    mesh.position.set(0, CFG.ROAD_Y, CFG.ROAD_Z);
    mesh.receiveShadow = true;
    this._root.add(mesh);

    // Tyre tracks
    const trackGeo = new THREE.PlaneGeometry(0.25, CFG.ROAD_LENGTH);
    this._geometries.add(trackGeo);
    const trackMat = new THREE.MeshStandardMaterial({ color:0x766451, roughness:1, metalness:0 });
    this._materials.add(trackMat);
    for (const xOff of [-1.2, 1.2]) {
      const t = new THREE.Mesh(trackGeo, trackMat);
      t.rotation.x = -Math.PI/2; t.rotation.z = Math.PI/2;
      t.position.set(xOff, CFG.ROAD_Y + 0.001, CFG.ROAD_Z);
      t.receiveShadow = true;
      this._root.add(t);
    }
  }

  _buildGrassPatches() {
    const count = this._lowEnd ? CFG.GRASS.COUNT_LOW : CFG.GRASS.COUNT_HIGH;
    const geo   = new THREE.CircleGeometry(0.5, this._lowEnd ? 4 : 6);
    this._geometries.add(geo);
    const mat = new THREE.MeshStandardMaterial({ color:0x4A7A1E, roughness:0.9, side:THREE.DoubleSide });
    this._materials.add(mat);
    const mesh  = new THREE.InstancedMesh(geo, mat, count);
    mesh.name   = 'GrassPatches'; mesh.receiveShadow = true;
    const dummy = new THREE.Object3D();
    let placed  = 0;
    for (let i = 0; i < count * 4 && placed < count; i++) {
      const x = randomFloat(-CFG.GRASS.SPREAD_X, CFG.GRASS.SPREAD_X);
      const z = randomFloat(-CFG.GRASS.SPREAD_Z, CFG.GRASS.SPREAD_Z);
      if (Math.sqrt(x*x + z*z) < CFG.PLAYFIELD_RADIUS) continue;
      const scale = randomFloat(CFG.GRASS.SCALE_MIN, CFG.GRASS.SCALE_MAX);
      dummy.position.set(x, CFG.GRASS.Y, z);
      dummy.rotation.x = -Math.PI/2; dummy.rotation.z = randomFloat(0, Math.PI*2);
      dummy.scale.setScalar(scale); dummy.updateMatrix();
      mesh.setMatrixAt(placed++, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true; mesh.count = placed;
    this._root.add(mesh);
  }

  _buildStones() {
    const count = this._lowEnd ? CFG.STONES.COUNT_LOW : CFG.STONES.COUNT_HIGH;
    const geo   = new THREE.DodecahedronGeometry(0.5, 0);
    this._geometries.add(geo);
    const mat = new THREE.MeshStandardMaterial({ color:0x8A8070, roughness:0.85, metalness:0.05 });
    this._materials.add(mat);
    const mesh  = new THREE.InstancedMesh(geo, mat, count);
    mesh.name   = 'Stones'; mesh.castShadow = true; mesh.receiveShadow = true;
    const dummy = new THREE.Object3D();
    let placed  = 0;
    for (let i = 0; i < count * 5 && placed < count; i++) {
      const x = randomFloat(-CFG.STONES.SPREAD_X, CFG.STONES.SPREAD_X);
      const z = randomFloat(-CFG.STONES.SPREAD_Z, CFG.STONES.SPREAD_Z);
      if (Math.sqrt(x*x + z*z) < CFG.PLAYFIELD_RADIUS) continue;
      const sx = randomFloat(CFG.STONES.SCALE_MIN, CFG.STONES.SCALE_MAX);
      const sy = sx * randomFloat(0.5, 1.0);
      const sz = sx * randomFloat(0.7, 1.2);
      dummy.position.set(x, sy*0.5, z);
      dummy.rotation.set(randomFloat(0,Math.PI), randomFloat(0,Math.PI), randomFloat(0,Math.PI));
      dummy.scale.set(sx, sy, sz); dummy.updateMatrix();
      mesh.setMatrixAt(placed++, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true; mesh.count = placed;
    this._root.add(mesh);
  }
}
