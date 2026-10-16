/**
 * src/gameplay/MatchManager.js
 * Match detection + full match sequence (glow → freeze → collect).
 */

import { RulesEngine } from './RulesEngine.js';
import { EventBus }    from '../core/EventBus.js';
import { EVENTS, ANIM, MATCH_FX, DEBUG } from '../utils/Constants.js';

export class MatchManager {
  constructor(config) {
    this._pile     = config.centerPile;
    this._animator = config.cardAnimator;
    this._audio    = config.audioManager;
  }

  async checkAndResolve(newCard, previousCard, activePlayer) {
    if (!previousCard) return false;
    if (!RulesEngine.isMatch(newCard, previousCard)) return false;
    if (DEBUG.ENABLED) console.log(`[MatchManager] MATCH! ${newCard.pictureID}`);
    await this._sequence(newCard, activePlayer);
    return true;
  }

  async _sequence(matchCard, winner) {
    await this._wait(ANIM.MATCH_FREEZE_DURATION * 1000);
    this._glowPile(true);
    EventBus.emit(EVENTS.MATCH_FOUND, { player:winner, pileCount:this._pile.count, cardID:matchCard.pictureID });
    this._audio.playSFX('sfx_match_win');
    await this._wait(ANIM.MATCH_TEXT_HOLD * 1000);
    this._glowPile(false);
    const cards = this._pile.collectAll();
    const targetPos = winner.id === 1
      ? { x:3.5, y:0.05, z:5.5 }
      : { x:-3.5, y:0.05, z:-5.5 };
    await this._animator.collectPile(cards, targetPos);
    winner.collectCards(cards);
    this._audio.playSFX('sfx_pile_collect');
    EventBus.emit(EVENTS.PILE_AWARDED, { player:winner, cardCount:cards.length });
  }

  _glowPile(active) {
    for (const card of this._pile._cards) card.setGlow(active, MATCH_FX.GLOW_COLOR);
  }

  _wait(ms) { return new Promise(r => setTimeout(r, ms)); }
}
