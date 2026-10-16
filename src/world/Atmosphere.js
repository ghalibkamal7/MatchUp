/**
 * src/world/Atmosphere.js
 * Dust, leaves, fireflies, birds — the living atmosphere layer.
 */

import * as THREE      from 'three';
import { randomFloat,
         randomInt }   from '../utils/MathUtils.js';
import { PARTICLES,
         DAY_NIGHT,
         DEBUG }       from '../utils/Constants.js';

export class Atmosphere {
  constructor(scene, options = {}) {
    this._scene     = scene;
    this._lowEnd    = options.isLowEnd     ?? false;
    this._treePos   = options.treePosition ?? new THREE.Vector3(-8,0,-10);
    this._dustPts   = null; this._leafPts = null; this._fireflyPts = null;
    this._birds     = []; this._birdTimer = 0;
    this._dustData  = []; this._leafData  = []; this._fireflyData = [];
    this._dustPos   = null; this._leafPos  = null; this._fireflyPos = null;
    this._timeOfDay = DAY_NIGHT.START_TIME;
  }

  build() {
    this._buildDust();
    this._buildLeaves();
    this._buildFireflies();
    if (!this._lowEnd) this._buildBirds();
    if (DEBUG.ENABLED) console.log('[Atmosphere] built');
  }

  update(delta, elapsed, timeOfDay) {
    if (timeOfDay !== undefined) this._timeOfDay = timeOfDay;
    this._updateDust(delta, elapsed);
    this._updateLeaves(delta, elapsed);
    this._updateFireflies(delta, elapsed);
    if (!this._lowEnd) this._updateBirds(delta, elapsed);
  }

  destroy() {
    for (const sys of [this._dustPts, this._leafPts, this._fireflyPts]) {
      if (!sys) continue; sys.geometry.dispose(); sys.material.dispose(); this._scene.remove(sys);
    }
    for (const b of this._birds) { this._scene.remove(b.mesh); b.mesh.geometry.dispose(); b.mesh.material.dispose(); }
    this._birds = [];
  }

  _buildDust() {
    const count = this._lowEnd ? Math.floor(PARTICLES.DUST.COUNT/2) : PARTICLES.DUST.COUNT;
    this._dustPos  = new Float32Array(count*3);
    this._dustData = [];
    for (let i = 0; i < count; i++) {
      const p = this._newDust(); this._dustData.push(p);
      this._dustPos[i*3]=p.x; this._dustPos[i*3+1]=p.y; this._dustPos[i*3+2]=p.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this._dustPos,3));
    const mat = new THREE.PointsMaterial({ color:PARTICLES.DUST.COLOR, size:PARTICLES.DUST.SIZE, transparent:true, opacity:PARTICLES.DUST.OPACITY, sizeAttenuation:true, depthWrite:false });
    this._dustPts = new THREE.Points(geo, mat); this._dustPts.name='Dust'; this._scene.add(this._dustPts);
  }

  _newDust() {
    return { x:randomFloat(-PARTICLES.DUST.SPREAD_X,PARTICLES.DUST.SPREAD_X), y:randomFloat(0.2,PARTICLES.DUST.SPREAD_Y), z:randomFloat(-PARTICLES.DUST.SPREAD_Z,PARTICLES.DUST.SPREAD_Z), vx:randomFloat(-0.008,0.008), vy:randomFloat(0.002,0.010), vz:randomFloat(-0.006,0.006), life:randomFloat(0,1) };
  }

  _updateDust(delta) {
    if (!this._dustPts) return;
    for (let i = 0; i < this._dustData.length; i++) {
      const p = this._dustData[i]; p.x+=p.vx; p.y+=p.vy; p.z+=p.vz; p.life+=delta*0.04;
      if (p.y > PARTICLES.DUST.SPREAD_Y || p.life > 1) {
        const f=this._newDust(); this._dustData[i]=f;
        this._dustPos[i*3]=f.x; this._dustPos[i*3+1]=0.2; this._dustPos[i*3+2]=f.z; continue;
      }
      this._dustPos[i*3]=p.x; this._dustPos[i*3+1]=p.y; this._dustPos[i*3+2]=p.z;
    }
    this._dustPts.geometry.attributes.position.needsUpdate=true;
  }

  _buildLeaves() {
    const count = this._lowEnd ? Math.floor(PARTICLES.LEAVES.COUNT/2) : PARTICLES.LEAVES.COUNT;
    this._leafPos  = new Float32Array(count*3);
    this._leafData = [];
    for (let i = 0; i < count; i++) {
      const p=this._newLeaf(); this._leafData.push(p);
      this._leafPos[i*3]=p.x; this._leafPos[i*3+1]=p.y; this._leafPos[i*3+2]=p.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this._leafPos,3));
    const mat = new THREE.PointsMaterial({ color:PARTICLES.LEAVES.COLOR, size:PARTICLES.LEAVES.SIZE, transparent:true, opacity:PARTICLES.LEAVES.OPACITY, sizeAttenuation:true, depthWrite:false });
    this._leafPts = new THREE.Points(geo, mat); this._leafPts.name='Leaves'; this._scene.add(this._leafPts);
  }

  _newLeaf() {
    const tx=this._treePos.x, tz=this._treePos.z;
    return { x:tx+randomFloat(-PARTICLES.LEAVES.SPAWN_RADIUS,PARTICLES.LEAVES.SPAWN_RADIUS), y:randomFloat(4,9), z:tz+randomFloat(-PARTICLES.LEAVES.SPAWN_RADIUS,PARTICLES.LEAVES.SPAWN_RADIUS), vy:-randomFloat(0.01,0.03), swayPhase:randomFloat(0,Math.PI*2) };
  }

  _updateLeaves(delta, elapsed) {
    if (!this._leafPts) return;
    for (let i = 0; i < this._leafData.length; i++) {
      const p=this._leafData[i];
      const sway=Math.sin(elapsed*PARTICLES.LEAVES.SWAY_SPEED+p.swayPhase)*PARTICLES.LEAVES.SWAY_AMPLITUDE;
      p.x+=sway*delta; p.y+=p.vy;
      if (p.y < 0) { const f=this._newLeaf(); this._leafData[i]=f; this._leafPos[i*3]=f.x; this._leafPos[i*3+1]=f.y; this._leafPos[i*3+2]=f.z; continue; }
      this._leafPos[i*3]=p.x; this._leafPos[i*3+1]=p.y; this._leafPos[i*3+2]=p.z;
    }
    this._leafPts.geometry.attributes.position.needsUpdate=true;
  }

  _buildFireflies() {
    const count = this._lowEnd ? Math.floor(PARTICLES.FIREFLIES.COUNT/2) : PARTICLES.FIREFLIES.COUNT;
    this._fireflyPos  = new Float32Array(count*3);
    this._fireflyData = [];
    for (let i = 0; i < count; i++) {
      const p=this._newFirefly(); this._fireflyData.push(p);
      this._fireflyPos[i*3]=p.x; this._fireflyPos[i*3+1]=p.y; this._fireflyPos[i*3+2]=p.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this._fireflyPos,3));
    const mat = new THREE.PointsMaterial({ color:PARTICLES.FIREFLIES.COLOR, size:PARTICLES.FIREFLIES.SIZE, transparent:true, opacity:0, sizeAttenuation:true, depthWrite:false });
    this._fireflyPts = new THREE.Points(geo, mat); this._fireflyPts.name='Fireflies'; this._scene.add(this._fireflyPts);
  }

  _newFirefly() {
    return { x:randomFloat(-PARTICLES.FIREFLIES.SPREAD_X,PARTICLES.FIREFLIES.SPREAD_X), y:randomFloat(0.5,PARTICLES.FIREFLIES.SPREAD_Y), z:randomFloat(-PARTICLES.FIREFLIES.SPREAD_Z,PARTICLES.FIREFLIES.SPREAD_Z), vx:randomFloat(-0.006,0.006), vy:randomFloat(-0.003,0.003), phase:randomFloat(0,Math.PI*2) };
  }

  _updateFireflies(delta, elapsed) {
    if (!this._fireflyPts) return;
    const nightT = Math.max(0, (this._timeOfDay - DAY_NIGHT.FIREFLY_START_TIME) / (1 - DAY_NIGHT.FIREFLY_START_TIME));
    this._fireflyPts.material.opacity = nightT * 0.85;
    if (nightT === 0) return;
    for (let i = 0; i < this._fireflyData.length; i++) {
      const p=this._fireflyData[i];
      p.x+=p.vx; p.y+=Math.sin(elapsed*PARTICLES.FIREFLIES.BLINK_SPEED+p.phase)*0.003; p.z+=p.vx*0.5;
      if (Math.abs(p.x)>PARTICLES.FIREFLIES.SPREAD_X) p.vx*=-1;
      if (p.y<0.3||p.y>PARTICLES.FIREFLIES.SPREAD_Y) p.vy*=-1;
      this._fireflyPos[i*3]=p.x; this._fireflyPos[i*3+1]=p.y; this._fireflyPos[i*3+2]=p.z;
    }
    this._fireflyPts.geometry.attributes.position.needsUpdate=true;
  }

  _buildBirds() { this._birdTimer = randomFloat(8,18); }

  _updateBirds(delta, elapsed) {
    this._birdTimer -= delta;
    if (this._birdTimer <= 0) { this._spawnBirds(); this._birdTimer = randomFloat(8,18); }
    for (let i = this._birds.length-1; i >= 0; i--) {
      const b = this._birds[i];
      b.mesh.position.x += b.speed * delta;
      b.mesh.position.y += Math.sin(elapsed*2+b.phase)*0.01;
      b.mesh.scale.y = 1 + Math.sin(elapsed*8+b.phase)*0.3;
      if (b.mesh.position.x > 80) {
        this._scene.remove(b.mesh); b.mesh.geometry.dispose(); b.mesh.material.dispose(); this._birds.splice(i,1);
      }
    }
  }

  _spawnBirds() {
    const count=randomInt(2,5);
    const mat = new THREE.MeshStandardMaterial({ color:0x1A1A2A, roughness:1 });
    for (let i = 0; i < count; i++) {
      const geo  = new THREE.BoxGeometry(0.6,0.05,0.18);
      const bird = new THREE.Mesh(geo, mat); bird.rotation.y = -Math.PI/2;
      bird.position.set(-70+randomFloat(-3,3), randomFloat(18,28), randomFloat(-40,-20)+i*randomFloat(1,3));
      this._scene.add(bird);
      this._birds.push({ mesh:bird, speed:randomFloat(5,9), phase:randomFloat(0,Math.PI*2) });
    }
  }
}
