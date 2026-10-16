/**
 * src/cards/CardPool.js
 * Object pool for Card instances — avoids GC spikes.
 */

import { Card }          from './Card.js';
import { CARD_PICTURES,
         GAME }          from '../utils/Constants.js';

let _nextID = 0;

export class CardPool {
  constructor() {
    this._all  = [];
    this._free = [];
  }

  buildDeck() {
    this._all = []; this._free = [];
    for (let copy = 0; copy < GAME.COPIES_PER_PICTURE; copy++) {
      for (const pic of CARD_PICTURES) {
        const card = new Card({ id: _nextID++, pictureID: pic.id, label: pic.label });
        card.build();
        this._all.push(card);
      }
    }
    return [...this._all];
  }

  release(card) {
    card.ownerID = null; card.isFaceUp = false;
    card.isInPile = false; card.isAnimating = false;
    card.setGlow(false);
    this._free.push(card);
  }

  disposeAll() {
    for (const card of this._all) card.dispose();
    this._all = []; this._free = [];
  }
}
