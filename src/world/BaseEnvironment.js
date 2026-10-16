/**
 * src/world/BaseEnvironment.js
 * Abstract base class — every map extends this and implements the same API.
 */

import * as THREE from 'three';
import { DEBUG }  from '../utils/Constants.js';

export class BaseEnvironment {
  constructor(scene, options = {}) {
    if (new.target === BaseEnvironment)
      throw new Error('[BaseEnvironment] Cannot instantiate directly.');
    this._scene      = scene;
    this._lowEnd     = options.isLowEnd ?? false;
    this._root       = new THREE.Group();
    this._root.name  = 'Environment';
    this._materials  = new Set();
    this._geometries = new Set();
    this._built      = false;
  }

  build() {
    if (this._built) { this._warn('build() called twice.'); return; }
    this._scene.add(this._root);
    this._built = true;
  }

  update(_delta, _elapsed) {}
  onResize(_w, _h) {}

  get banyanPosition() { throw new Error('[BaseEnvironment] Implement banyanPosition.'); }
  get tablePosition()  { throw new Error('[BaseEnvironment] Implement tablePosition.');  }
  get p1Position()     { throw new Error('[BaseEnvironment] Implement p1Position.');     }
  get p2Position()     { throw new Error('[BaseEnvironment] Implement p2Position.');     }

  _makeMaterial(MaterialClass, params = {}) {
    const mat = new MaterialClass(params);
    this._materials.add(mat);
    return mat;
  }

  _makeGeometry(GeomClass, ...args) {
    const geo = new GeomClass(...args);
    this._geometries.add(geo);
    return geo;
  }

  _add(obj) { this._root.add(obj); return obj; }

  destroy() {
    for (const geo of this._geometries) geo.dispose();
    this._geometries.clear();
    for (const mat of this._materials) {
      for (const v of Object.values(mat)) { if (v && v.isTexture) v.dispose(); }
      mat.dispose();
    }
    this._materials.clear();
    this._scene.remove(this._root);
    this._built = false;
    this._log('destroyed.');
  }

  _log(msg)  { if (DEBUG.ENABLED) console.log(`[${this.constructor.name}] ${msg}`); }
  _warn(msg) { console.warn(`[${this.constructor.name}] ${msg}`); }
}
