/**
 * src/players/CPUPlayer.js
 * CPU — never cheats, sees only public info. Difficulty = reaction time only.
 */

import { Player }     from './Player.js';
import { randomFloat } from '../utils/MathUtils.js';
import { DEBUG }      from '../utils/Constants.js';

const REACTION = Object.freeze({
  easy:   { min:1400, max:2600 },
  medium: { min:700,  max:1400 },
  hard:   { min:280,  max:700  },
});

const MISS_CHANCE = Object.freeze({ easy:0.12, medium:0, hard:0 });

export class CPUPlayer extends Player {
  constructor(config) {
    super({ ...config, type:'cpu' });
    this.difficulty = config.difficulty ?? 'medium';
    this._thinking  = false;
  }

  async takeTurn(_pileTopCard) {
    if (this._thinking) return null;
    this._thinking = true;
    const card = this.topCard;
    if (!card) { this._thinking = false; return null; }
    const range = REACTION[this.difficulty] ?? REACTION.medium;
    let delay   = randomFloat(range.min, range.max);
    if (Math.random() < (MISS_CHANCE[this.difficulty] ?? 0)) {
      delay += randomFloat(800, 1800);
      if (DEBUG.ENABLED) console.log('[CPU] hesitating');
    }
    await new Promise(r => setTimeout(r, delay));
    const drawn = this.drawCard();
    this._thinking = false;
    return drawn;
  }

  get isThinking() { return this._thinking; }
}
