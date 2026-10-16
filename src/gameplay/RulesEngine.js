/**
 * src/gameplay/RulesEngine.js
 * Pure game rules — stateless, no side effects.
 */

export class RulesEngine {
  static isMatch(cardA, cardB) {
    if (!cardA || !cardB) return false;
    return cardA.pictureID === cardB.pictureID;
  }

  static determineWinner(cardCounts) {
    let max = -1, winner = null, tie = false;
    for (const [pid, count] of cardCounts.entries()) {
      if      (count > max) { max = count; winner = pid; tie = false; }
      else if (count === max) { tie = true; }
    }
    return tie ? null : winner;
  }

  static isGameOver(players) {
    return players.every(p => p.handCount === 0);
  }

  static shouldSkipPlayer(player) {
    return player.handCount === 0;
  }
}
