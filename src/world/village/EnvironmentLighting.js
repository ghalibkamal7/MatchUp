/**
 * src/world/village/EnvironmentLighting.js
 * All Three.js lights for the village — single source of truth.
 */

import * as THREE  from 'three';
import { LIGHTING, DAY_NIGHT, DEBUG } from '../../utils/Constants.js';
import { lerp, clamp }                from '../../utils/MathUtils.js';

export class EnvironmentLighting {
  constructor(scene, options = {}) {
    this._scene        = scene;
    this._lowEnd       = options.isLowEnd ?? false;
    this._ambient      = null;
    this._sun          = null;
    this._fill         = null;
    this._lantern      = null;
    this._tableFill    = null;
    this._timeOfDay    = DAY_NIGHT.START_TIME;
    this._flickerPhase = Math.random() * Math.PI * 2;
    this._built        = false;
  }

  build() {
    if (this._built) return;
    this._buildAmbient();
    this._buildSun();
    this._buildFill();
    this._buildLantern();
    this._buildTableFill();
    this._built = true;
    if (DEBUG.ENABLED) console.log('[EnvironmentLighting] built');
  }

  update(delta) {
    if (!this._built) return;
    this._timeOfDay = (this._timeOfDay + delta * DAY_NIGHT.TIME_SCALE) % 1;
    this._updateLanternFlicker(delta);
    this._updateDayNight();
  }

  get sunLight()     { return this._sun; }
  get lanternLight() { return this._lantern; }
  get timeOfDay()    { return this._timeOfDay; }

  destroy() {
    [this._ambient, this._sun, this._fill, this._lantern, this._tableFill].forEach(l => {
      if (!l) return;
      if (l.shadow?.map) l.shadow.map.dispose();
      this._scene.remove(l);
    });
    this._built = false;
  }

  _buildAmbient() {
    this._ambient = new THREE.AmbientLight(LIGHTING.AMBIENT_COLOR, LIGHTING.AMBIENT_INTENSITY);
    this._ambient.name = 'AmbientLight';
    this._scene.add(this._ambient);
  }

  _buildSun() {
    this._sun = new THREE.DirectionalLight(LIGHTING.SUN_COLOR, LIGHTING.SUN_INTENSITY);
    this._sun.name = 'SunLight';
    this._sun.position.set(LIGHTING.SUN_POSITION.x, LIGHTING.SUN_POSITION.y, LIGHTING.SUN_POSITION.z);
    this._sun.castShadow = true;
    const res = this._lowEnd ? 512 : 1024;
    this._sun.shadow.mapSize.set(res, res);
    this._sun.shadow.camera.near   = 0.5;
    this._sun.shadow.camera.far    = 120;
    this._sun.shadow.camera.left   = -30;
    this._sun.shadow.camera.right  =  30;
    this._sun.shadow.camera.top    =  30;
    this._sun.shadow.camera.bottom = -30;
    this._sun.shadow.bias          = -0.001;
    this._sun.shadow.normalBias    =  0.02;
    this._sun.target.position.set(0, 0, 0);
    this._scene.add(this._sun);
    this._scene.add(this._sun.target);
  }

  _buildFill() {
    this._fill = new THREE.DirectionalLight(LIGHTING.FILL_COLOR, LIGHTING.FILL_INTENSITY);
    this._fill.name = 'FillLight';
    this._fill.position.set(LIGHTING.FILL_POSITION.x, LIGHTING.FILL_POSITION.y, LIGHTING.FILL_POSITION.z);
    this._fill.castShadow = false;
    this._scene.add(this._fill);
  }

  _buildLantern() {
    this._lantern = new THREE.PointLight(LIGHTING.LANTERN_COLOR, LIGHTING.LANTERN_INTENSITY, LIGHTING.LANTERN_DISTANCE, LIGHTING.LANTERN_DECAY);
    this._lantern.name = 'LanternLight';
    this._lantern.position.set(LIGHTING.LANTERN_POSITION.x, LIGHTING.LANTERN_POSITION.y, LIGHTING.LANTERN_POSITION.z);
    this._lantern.castShadow = false;
    this._scene.add(this._lantern);
  }

  _buildTableFill() {
    this._tableFill = new THREE.PointLight(LIGHTING.TABLE_LIGHT_COLOR, LIGHTING.TABLE_LIGHT_INTENSITY, LIGHTING.TABLE_LIGHT_DISTANCE, 2);
    this._tableFill.name = 'TableFillLight';
    this._tableFill.position.set(LIGHTING.TABLE_LIGHT_POSITION.x, LIGHTING.TABLE_LIGHT_POSITION.y, LIGHTING.TABLE_LIGHT_POSITION.z);
    this._tableFill.castShadow = false;
    this._scene.add(this._tableFill);
  }

  _updateLanternFlicker(delta) {
    if (!this._lantern) return;
    this._flickerPhase += delta * LIGHTING.LANTERN_FLICKER_SPEED;
    const slow   = Math.sin(this._flickerPhase * 1.0) * 0.5 + 0.5;
    const fast   = Math.sin(this._flickerPhase * 3.7) * 0.5 + 0.5;
    const noise  = slow * 0.7 + fast * 0.3;
    this._lantern.intensity = lerp(LIGHTING.LANTERN_FLICKER_MIN, LIGHTING.LANTERN_FLICKER_MAX, noise);
  }

  _updateDayNight() {
    const nightT = clamp((this._timeOfDay - DAY_NIGHT.FIREFLY_START_TIME) / (1 - DAY_NIGHT.FIREFLY_START_TIME), 0, 1);
    const ambDay   = new THREE.Color(LIGHTING.AMBIENT_COLOR);
    const ambNight = new THREE.Color(LIGHTING.NIGHT_AMBIENT_COLOR);
    if (nightT <= 0) {
      this._ambient.color.copy(ambDay);
      this._ambient.intensity = LIGHTING.AMBIENT_INTENSITY;
      this._sun.intensity = LIGHTING.SUN_INTENSITY;
      this._lantern.distance = LIGHTING.LANTERN_DISTANCE;
      return;
    }
    this._ambient.color.lerpColors(ambDay, ambNight, nightT);
    this._ambient.intensity = lerp(LIGHTING.AMBIENT_INTENSITY, LIGHTING.NIGHT_AMBIENT_INTENSITY, nightT);
    this._sun.intensity     = lerp(LIGHTING.SUN_INTENSITY, LIGHTING.NIGHT_SUN_INTENSITY, nightT);
    this._lantern.distance  = LIGHTING.LANTERN_DISTANCE;
    if (nightT > 0.3) {
      const boost = clamp((nightT - 0.3) / 0.7, 0, 1);
      this._lantern.intensity = lerp(this._lantern.intensity, LIGHTING.LANTERN_INTENSITY * 3.0, boost);
      this._lantern.distance  = lerp(LIGHTING.LANTERN_DISTANCE, LIGHTING.LANTERN_DISTANCE * 2, boost);
    }
  }
}
