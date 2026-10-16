/**
 * src/world/Village.js
 * Village environment orchestrator — default map, extends BaseEnvironment.
 */

import * as THREE            from 'three';
import { BaseEnvironment }   from './BaseEnvironment.js';
import { Terrain }           from './village/Terrain.js';
import { Structures }        from './village/Structures.js';
import { BanyanTree }        from './village/BanyanTree.js';
import { Props }             from './village/Props.js';
import { ATMOSPHERE, TABLE } from '../utils/Constants.js';

const LAYOUT = Object.freeze({
  BANYAN:    new THREE.Vector3(-12, 0, -10),
  TABLE:     new THREE.Vector3(0, TABLE.SURFACE_Y, 0),
  CHAIR_P1:  new THREE.Vector3(0, 0,  3.5),
  CHAIR_P2:  new THREE.Vector3(0, 0, -3.5),
  TEA_STALL: new THREE.Vector3(12, 0, -18),
  HOUSES: [
    new THREE.Vector3( 14, 0, -28),
    new THREE.Vector3( 20, 0, -24),
    new THREE.Vector3( 26, 0, -30),
    new THREE.Vector3(-16, 0, -25),
  ],
  LANTERN:   new THREE.Vector3(12, 3.0, -17.2),
  POTS: [
    new THREE.Vector3(10,   0, -14),
    new THREE.Vector3(11.5, 0, -13.5),
    new THREE.Vector3(13.5, 0, -16),
  ],
  P1_WORLD:  new THREE.Vector3(0, 0,  5),
  P2_WORLD:  new THREE.Vector3(0, 0, -5),
});

export class Village extends BaseEnvironment {
  constructor(scene, options = {}) {
    super(scene, options);
    this._terrain    = null;
    this._structures = null;
    this._banyan     = null;
    this._props      = null;
    this._lanternRef = null;
    this._looseCardRef = null;
    this._windPhase    = 0;
    this._lanternPhase = 0;
  }

  build() {
    super.build();

    this._terrain = new Terrain(this._root, { isLowEnd:this._lowEnd, materials:this._materials, geometries:this._geometries });
    this._terrain.build();

    this._banyan = new BanyanTree(this._root, { position:LAYOUT.BANYAN, isLowEnd:this._lowEnd, materials:this._materials, geometries:this._geometries });
    this._banyan.build();

    this._structures = new Structures(this._root, {
      tablePosition: LAYOUT.TABLE, chairP1:LAYOUT.CHAIR_P1, chairP2:LAYOUT.CHAIR_P2,
      teaStall:LAYOUT.TEA_STALL, houses:LAYOUT.HOUSES, isLowEnd:this._lowEnd,
      materials:this._materials, geometries:this._geometries,
    });
    this._structures.build();

    this._props = new Props(this._root, { lanternPosition:LAYOUT.LANTERN, pots:LAYOUT.POTS, isLowEnd:this._lowEnd, materials:this._materials, geometries:this._geometries });
    this._props.build();

    this._lanternRef   = this._props.lanternGroup;
    this._looseCardRef = this._structures.looseCard;
    this._log('Village built.');
  }

  update(delta, elapsed) {
    this._windPhase    += delta * ATMOSPHERE.WIND_STRENGTH;
    this._lanternPhase += delta * ATMOSPHERE.LANTERN_SWING_SPEED;

    if (this._lanternRef)
      this._lanternRef.rotation.z = Math.sin(this._lanternPhase) * ATMOSPHERE.LANTERN_SWING_AMP;

    if (this._looseCardRef)
      this._looseCardRef.rotation.z = Math.sin(this._windPhase * ATMOSPHERE.LOOSE_CARD_SPEED) * ATMOSPHERE.LOOSE_CARD_SWAY;

    this._banyan?.update(delta, elapsed, this._windPhase);
    this._structures?.update(delta, elapsed, this._windPhase);
  }

  get banyanPosition() { return LAYOUT.BANYAN.clone(); }
  get tablePosition()  { return LAYOUT.TABLE.clone();  }
  get p1Position()     { return LAYOUT.P1_WORLD.clone(); }
  get p2Position()     { return LAYOUT.P2_WORLD.clone(); }

  destroy() {
    this._terrain?.destroy();
    this._banyan?.destroy();
    this._structures?.destroy();
    this._props?.destroy();
    super.destroy();
  }
}
