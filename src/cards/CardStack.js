/**
 * src/cards/CardStack.js
 * Physical card stack — center pile or collected pile.
 */

import * as THREE      from 'three';
import { CARD }        from '../utils/Constants.js';
import { randomFloat } from '../utils/MathUtils.js';

export class CardStack {
  constructor(origin, name = 'Stack') {
    this.name   = name;
    this.origin = origin.clone();
    this._cards = [];
  }

  push(card) {
    this._cards.push(card);
    card.isInPile = true;
    return this._topPosition();
  }

  pop() {
    const card = this._cards.pop() ?? null;
    if (card) card.isInPile = false;
    return card;
  }

  collectAll() {
    const all = [...this._cards];
    this._cards = [];
    for (const c of all) c.isInPile = false;
    return all;
  }

  get top()    { return this._cards[this._cards.length - 1] ?? null; }
  get count()  { return this._cards.length; }
  get isEmpty(){ return this._cards.length === 0; }

  _topPosition() {
    return new THREE.Vector3(
      this.origin.x + randomFloat(-0.01, 0.01),
      this.origin.y + this._cards.length * CARD.DECK_LAYER_OFFSET,
      this.origin.z + randomFloat(-0.01, 0.01),
    );
  }

  getPositionAt(index) {
    return new THREE.Vector3(
      this.origin.x,
      this.origin.y + index * CARD.DECK_LAYER_OFFSET,
      this.origin.z,
    );
  }

  static randomPileRotation() {
    return randomFloat(-CARD.PILE_ROTATION_VARIANCE, CARD.PILE_ROTATION_VARIANCE);
  }
}
