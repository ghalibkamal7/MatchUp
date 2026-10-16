/**
 * src/world/village/WindSystem.js
 * Central wind simulation — all other systems read from this single source.
 */

import * as THREE        from 'three';
import { randomFloat,
         weightedRandom } from '../../utils/MathUtils.js';
import { ATMOSPHERE,
         DEBUG }          from '../../utils/Constants.js';

const GUST = Object.freeze({
  DURATION_MIN:  1.5, DURATION_MAX:  3.5,
  ATTACK_RATIO:  0.25, RELEASE_RATIO: 0.45,
  FREQUENCY: [
    { value:'light', weight:60 }, { value:'medium', weight:30 }, { value:'strong', weight:10 },
  ],
});
const GUST_STRENGTH = Object.freeze({
  light: {min:1.2,max:1.6}, medium:{min:1.6,max:2.2}, strong:{min:2.2,max:3.0},
});
const BASE_DIR      = Math.PI * 0.15;
const DRIFT_SPEED   = 0.04;
const DRIFT_MAX     = Math.PI * 0.25;

export class WindSystem {
  constructor() {
    this.windVector   = new THREE.Vector2(Math.cos(BASE_DIR) * ATMOSPHERE.WIND_STRENGTH, Math.sin(BASE_DIR) * ATMOSPHERE.WIND_STRENGTH);
    this.windStrength = ATMOSPHERE.WIND_STRENGTH;
    this.phase        = 0;
    this.gustProgress = 0;
    this._direction   = BASE_DIR;
    this._driftPhase  = 0;
    this._nextGustIn  = randomFloat(ATMOSPHERE.WIND_GUST_INTERVAL * 0.6, ATMOSPHERE.WIND_GUST_INTERVAL * 1.5);
    this._activeGust  = null;
    this._gustElapsed = 0;
  }

  update(delta) {
    this._updatePhase(delta);
    this._updateDirection(delta);
    this._updateGust(delta);
    this._updateOutput();
  }

  triggerGust(intensity = 'medium') {
    if (this._activeGust) return;
    this._startGust(intensity);
  }

  _updatePhase(delta) {
    this.phase += delta * ATMOSPHERE.WIND_STRENGTH * (0.8 + this.windStrength * 0.4) * 2.5;
  }

  _updateDirection(delta) {
    this._driftPhase += delta * DRIFT_SPEED;
    this._direction   = BASE_DIR + Math.sin(this._driftPhase) * DRIFT_MAX;
  }

  _updateGust(delta) {
    if (this._activeGust) {
      this._advanceGust(delta);
    } else {
      this._nextGustIn -= delta;
      if (this._nextGustIn <= 0) {
        this._startGust(weightedRandom(GUST.FREQUENCY));
      }
    }
  }

  _startGust(type) {
    const sr = GUST_STRENGTH[type] ?? GUST_STRENGTH.medium;
    this._activeGust  = { type, duration: randomFloat(GUST.DURATION_MIN, GUST.DURATION_MAX), strength: randomFloat(sr.min, sr.max), dirShift: randomFloat(-0.3, 0.3) };
    this._gustElapsed = 0;
  }

  _advanceGust(delta) {
    this._gustElapsed += delta;
    const gust      = this._activeGust;
    const progress  = this._gustElapsed / gust.duration;
    if (progress >= 1) { this._activeGust = null; this._gustElapsed = 0; this.gustProgress = 0; this._nextGustIn = randomFloat(ATMOSPHERE.WIND_GUST_INTERVAL * 0.6, ATMOSPHERE.WIND_GUST_INTERVAL * 1.5); return; }
    const attackEnd    = GUST.ATTACK_RATIO;
    const releaseStart = 1 - GUST.RELEASE_RATIO;
    let envelope;
    if      (progress < attackEnd)    envelope = progress / attackEnd;
    else if (progress < releaseStart) envelope = 1 - Math.sin((progress - attackEnd) / (releaseStart - attackEnd) * Math.PI * 2) * 0.08;
    else                              envelope = 1 - (progress - releaseStart) / GUST.RELEASE_RATIO;
    this.gustProgress  = envelope;
    this._direction   += gust.dirShift * delta * 0.5;
  }

  _updateOutput() {
    const gustAdd     = this._activeGust ? this._activeGust.strength * this.gustProgress : 0;
    this.windStrength = ATMOSPHERE.WIND_STRENGTH + gustAdd;
    this.windVector.set(Math.cos(this._direction) * this.windStrength, Math.sin(this._direction) * this.windStrength);
  }
}
