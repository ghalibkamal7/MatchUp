/**
 * src/gameplay/WinnerManager.js
 * Game-over detection and winner announcement.
 */

import { RulesEngine }   from './RulesEngine.js';
import { EventBus }      from '../core/EventBus.js';
import { EVENTS, DEBUG } from '../utils/Constants.js';

export class WinnerManager {
  constructor(players) { this._players = [...players]; }

  evaluate() {
    const overNow = RulesEngine.isGameOver(this._players);
    if (!overNow) return { over:false, winnerID:null, isTie:false };
    const counts   = new Map(this._players.map(p => [p.id, p.totalCards]));
    const winnerID = RulesEngine.determineWinner(counts);
    const isTie    = winnerID === null;
    if (DEBUG.ENABLED) console.log(`[WinnerManager] Game over — winner: ${winnerID ?? 'TIE'}`);
    EventBus.emit(EVENTS.GAME_OVER, { winnerID, isTie, scores: Object.fromEntries(counts) });
    return { over:true, winnerID, isTie };
  }
}
