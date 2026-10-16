/**
 * src/gameplay/PileManager.js
 * Center pile — add cards, query state, reset.
 */

import * as THREE    from 'three';
import { CardStack } from '../cards/CardStack.js';

export class PileManager {
  constructor(scene, position) {
    this._scene    = scene;
    this._position = position.clone();
    this._stack    = new CardStack(position, 'CenterPile');
  }

  addCard(card) {
    const landPos = this._stack.push(card);
    card.mesh.rotation.y = CardStack.randomPileRotation();
    return landPos;
  }

  get topCard()      { return this._stack.top; }
  get previousCard() {
    const cards = this._stack._cards;
    return cards.length >= 2 ? cards[cards.length-2] : null;
  }
  get count()   { return this._stack.count; }
  get isEmpty() { return this._stack.isEmpty; }
  get stack()   { return this._stack; }

  collectAll() { return this._stack.collectAll(); }
  reset()      { this._stack = new CardStack(this._position, 'CenterPile'); }
}
