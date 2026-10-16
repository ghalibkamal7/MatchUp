/**
 * src/players/PlayerHand.js
 * Visual 3D hand — fan of cards in the scene.
 */

import * as THREE from 'three';
export class PlayerHand {
  constructor(config) {
    this._scene    = config.scene;
    this._position = config.position.clone();
    this._facing   = config.facing  ?? 1;
    this._animator = config.animator;
    this._cards    = [];
  }

  async receiveCards(cards, deckOrigin) {
    this._cards = [...cards];
    for (const card of this._cards) {
      card.mesh.position.copy(deckOrigin);
      card.mesh.rotation.x = Math.PI;
      this._scene.add(card.mesh);
    }
    this._animator.arrangeFan(this._cards, this._position, this._facing, true);
    await new Promise(r => setTimeout(r, 700));
  }

  takeTopCard() {
    if (!this._cards.length) return null;
    const card = this._cards.shift();
    this._scene.remove(card.mesh);
    if (this._cards.length) {
      this._animator.arrangeFan(this._cards, this._position, this._facing, true);
    }
    return card;
  }

  get topCard()          { return this._cards[0] ?? null; }
  get count()            { return this._cards.length; }
  get topCardPosition()  { return this.topCard?.mesh.position.clone() ?? this._position.clone(); }

  removeAllFromScene() {
    for (const card of this._cards) this._scene.remove(card.mesh);
    this._cards = [];
  }
}
