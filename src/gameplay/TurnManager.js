/**
 * src/gameplay/TurnManager.js
 * Turn order, switching, lock during animations.
 */

import { EventBus }      from '../core/EventBus.js';
import { EVENTS, DEBUG } from '../utils/Constants.js';

export class TurnManager {
  constructor(players) {
    this._players     = [...players];
    this._activeIndex = 0;
    this._turnNumber  = 0;
    this._locked      = false;
  }

  get activePlayer()   { return this._players[this._activeIndex]; }
  get inactivePlayer() { return this._players[(this._activeIndex+1) % this._players.length]; }
  get isLocked()       { return this._locked; }
  get turnNumber()     { return this._turnNumber; }

  startGame() {
    this._activeIndex = Math.floor(Math.random() * this._players.length);
    this._turnNumber  = 1;
    this._emit();
  }

  nextTurn(winnerID) {
    if (this._locked) return;
    if (winnerID !== undefined) {
      const idx = this._players.findIndex(p => p.id === winnerID);
      if (idx !== -1) this._activeIndex = idx;
    } else {
      this._activeIndex = (this._activeIndex+1) % this._players.length;
    }
    this._turnNumber++;
    this._emit();
    if (DEBUG.ENABLED) console.log(`[TurnManager] Turn ${this._turnNumber} — P${this.activePlayer.id}`);
  }

  lock()   { this._locked = true;  }
  unlock() { this._locked = false; }

  reset() { this._activeIndex = 0; this._turnNumber = 0; this._locked = false; }

  _emit() {
    EventBus.emit(EVENTS.TURN_START, { player: this.activePlayer, turnNumber: this._turnNumber });
  }
}
