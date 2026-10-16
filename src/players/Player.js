/**
 * src/players/Player.js
 * Data model for a player — hand, collected pile, state.
 */

export class Player {
  constructor({ id, name, type = 'human' }) {
    this.id        = id;
    this.name      = name;
    this.type      = type;
    this.hand      = [];
    this.collected = [];
    this.isActive  = false;
  }

  drawCard()   { return this.hand.shift() ?? null; }
  get topCard(){ return this.hand[0] ?? null; }

  get handCount()      { return this.hand.length; }
  get collectedCount() { return this.collected.length; }
  get totalCards()     { return this.hand.length + this.collected.length; }
  get isEliminated()   { return this.hand.length === 0 && this.collected.length === 0; }

  collectCards(cards) { this.collected.push(...cards); }

  cycleCollectedToHand() {
    if (!this.collected.length) return false;
    this.hand = [...this.collected]; this.collected = []; return true;
  }

  reset() { this.hand = []; this.collected = []; this.isActive = false; }
}
