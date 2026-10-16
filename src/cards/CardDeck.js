/**
 * src/cards/CardDeck.js
 * Logical deck — shuffle, draw, track remaining.
 */

import { shuffleArray } from '../utils/MathUtils.js';

export class CardDeck {
  constructor(cards) {
    this._cards = [...cards];
  }

  shuffle() { shuffleArray(this._cards); return this; }

  draw()    { return this._cards.pop() ?? null; }

  drawAll() {
    const all = [...this._cards];
    this._cards = [];
    return all;
  }

  reset(cards) { this._cards = [...cards]; shuffleArray(this._cards); }

  get remaining() { return this._cards.length; }
  get isEmpty()   { return this._cards.length === 0; }
}
