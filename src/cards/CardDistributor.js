/**
 * src/cards/CardDistributor.js
 * Deals cards alternately to players — round-robin style.
 */

export class CardDistributor {
  static deal(cards, playerIDs) {
    const hands = new Map();
    for (const id of playerIDs) hands.set(id, []);
    let i = 0;
    for (const card of cards) {
      const pid = playerIDs[i % playerIDs.length];
      hands.get(pid).push(card);
      card.ownerID = pid;
      i++;
    }
    return hands;
  }
}
