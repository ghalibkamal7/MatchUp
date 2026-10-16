/**
 * src/gameplay/GameManager.js
 * Master game controller — wires all gameplay systems.
 */

import * as THREE          from 'three';
import { Player }          from '../players/Player.js';
import { CPUPlayer }       from '../players/CPUPlayer.js';
import { PlayerHand }      from '../players/PlayerHand.js';
import { CardPool }        from '../cards/CardPool.js';
import { CardDeck }        from '../cards/CardDeck.js';
import { CardDistributor } from '../cards/CardDistributor.js';
import { CardAnimator }    from '../cards/CardAnimator.js';
import { PileManager }     from './PileManager.js';
import { TurnManager }     from './TurnManager.js';
import { MatchManager }    from './MatchManager.js';
import { ScoreManager }    from './ScoreManager.js';
import { WinnerManager }   from './WinnerManager.js';
import { RulesEngine }     from './RulesEngine.js';
import { EventBus }        from '../core/EventBus.js';
import { SaveSystem }      from '../core/SaveSystem.js';
import { EVENTS, GAME,
         CARD, DEBUG }     from '../utils/Constants.js';

const STATE = Object.freeze({
  IDLE:'idle', DEALING:'dealing', PLAYER_TURN:'player_turn',
  CPU_TURN:'cpu_turn', ANIMATING:'animating', MATCH:'match', GAME_OVER:'game_over',
});

export class GameManager {
  constructor(config) {
    this._scene      = config.scene;
    this._audio      = config.audioManager;
    this._gameMode   = config.gameMode   ?? 'vs_cpu';
    this._difficulty = config.difficulty ?? 'medium';
    this._state      = STATE.IDLE;
    this._pool       = null; this._deck = null;
    this._players    = []; this._hands = new Map();
    this._pile       = null; this._turns = null;
    this._matches    = null; this._scores = null; this._winners = null;
    this._animator   = new CardAnimator();
    this._prevTopCard = null;
    this._generation = 0;
  }

  async init() {
    const generation = ++this._generation;
    this._buildPlayers();
    this._buildSystems();
    await this._deal();
    if (generation !== this._generation) return;
    this._startGame();
  }

  _buildPlayers() {
    const p1 = new Player({ id:GAME.PLAYER_1_ID, name: (()=>{ try { return SaveSystem.get('profile','name') ?? 'Player 1'; } catch(e){ return 'Player 1'; } })(), type:'human' });
    const p2 = this._gameMode === 'vs_cpu'
      ? new CPUPlayer({ id:GAME.PLAYER_2_ID, name:'CPU', difficulty:this._difficulty })
      : new Player({ id:GAME.PLAYER_2_ID, name:'Player 2', type:'human' });
    this._players = [p1, p2];
  }

  _buildSystems() {
    this._pool     = new CardPool();
    const cards    = this._pool.buildDeck();
    this._deck     = new CardDeck(cards);
    this._deck.shuffle();
    this._pile     = new PileManager(this._scene, new THREE.Vector3(CARD.PILE_POSITION.x, CARD.PILE_POSITION.y, CARD.PILE_POSITION.z));
    this._turns    = new TurnManager(this._players);
    this._matches  = new MatchManager({ centerPile: this._pile.stack, cardAnimator: this._animator, audioManager: this._audio });
    this._scores   = new ScoreManager(this._players);
    this._winners  = new WinnerManager(this._players);
  }

  async _deal() {
    this._setState(STATE.DEALING);
    const allCards = this._deck.drawAll();
    const hands    = CardDistributor.deal(allCards, [GAME.PLAYER_1_ID, GAME.PLAYER_2_ID]);
    for (const p of this._players) p.hand = hands.get(p.id) ?? [];

    const deckOrigin = new THREE.Vector3(0, 1.5, 0);

    const makeHand = (playerID, px, py, pz, facing) => {
      const hand = new PlayerHand({
        scene:this._scene, position:new THREE.Vector3(px,py,pz),
        facing, animator:this._animator, playerID,
      });
      this._hands.set(playerID, hand);
      return hand;
    };

    const h1 = makeHand(GAME.PLAYER_1_ID, CARD.P1_DECK_POSITION.x, CARD.P1_DECK_POSITION.y, CARD.P1_DECK_POSITION.z,  1);
    const h2 = makeHand(GAME.PLAYER_2_ID, CARD.P2_DECK_POSITION.x, CARD.P2_DECK_POSITION.y, CARD.P2_DECK_POSITION.z, -1);

    await Promise.all([
      h1.receiveCards(this._players[0].hand, deckOrigin),
      h2.receiveCards(this._players[1].hand, deckOrigin),
    ]);
    this._audio.playSFX('sfx_deal');
  }

  _startGame() {
    this._turns.startGame();
    this._scores.update();
    this._processCurrentTurn(this._generation);
  }

  async _processCurrentTurn(generation = this._generation) {
    if (generation !== this._generation || this._state === STATE.GAME_OVER) return;
    const player = this._turns.activePlayer;
    const result = this._winners.evaluate();
    if (result.over) { this._endGame(result); return; }
    if (RulesEngine.shouldSkipPlayer(player)) {
      this._turns.nextTurn();
      return this._processCurrentTurn(generation);
    }
    if (player.type === 'cpu') {
      this._setState(STATE.CPU_TURN);
      await this._handleCPUTurn(player, generation);
    } else {
      this._setState(STATE.PLAYER_TURN);
    }
  }

  async humanPlayCard() {
    if (this._state !== STATE.PLAYER_TURN || this._turns.isLocked) return;
    const generation = this._generation;
    const player = this._turns.activePlayer;
    const hand   = this._hands.get(player.id);
    if (!hand || !hand.count) return;
    await this._playCard(player, hand, player.drawCard(), generation);
  }

  async _handleCPUTurn(player, generation) {
    const hand = this._hands.get(player.id);
    const card = await player.takeTurn(this._pile.topCard);
    if (generation !== this._generation || !card || !hand) return;
    await this._playCard(player, hand, card, generation);
  }

  async _playCard(player, hand, card, generation = this._generation) {
    if (generation !== this._generation || !card) return;
    const turns = this._turns;
    turns.lock();
    this._setState(STATE.ANIMATING);
    let isMatch = false;
    try {
      const fromPos = card.mesh.position.clone();
      hand.takeTopCard();
      const pilePos = this._pile.addCard(card);
      this._scene.add(card.mesh);
      EventBus.emit(EVENTS.CARD_PLAY_START, { player, card });
      this._audio.playSFX('sfx_card_lift');
      await this._animator.playCard(card, fromPos, pilePos, true);
      if (generation !== this._generation) return;
      this._audio.playSFX('sfx_card_place');
      const prevCard = this._prevTopCard;
      this._prevTopCard = card;
      isMatch = await this._matches.checkAndResolve(card, prevCard, player);
      if (generation !== this._generation) return;
      if (isMatch) this._prevTopCard = null;
    } finally {
      turns.unlock();
    }
    if (generation !== this._generation) return;
    turns.nextTurn(isMatch ? player.id : undefined);
    this._scores.update();
    await this._processCurrentTurn(generation);
  }

  _endGame({ winnerID }) {
    this._setState(STATE.GAME_OVER);
    this._audio.playSFX('sfx_game_over');
    try {
      const stats = SaveSystem.get('statistics');
      const won = winnerID === GAME.PLAYER_1_ID;
      SaveSystem.set('statistics', {
        matchesPlayed: (stats.matchesPlayed ?? 0) + 1,
        matchesWon: won ? (stats.matchesWon ?? 0) + 1 : (stats.matchesWon ?? 0),
        matchesLost: winnerID !== null && !won ? (stats.matchesLost ?? 0) + 1 : (stats.matchesLost ?? 0),
      });
      SaveSystem.save('statistics');
    } catch(e) {}
  }

  reset() {
    this._generation++;
    this._animator.killAll();
    for (const hand of this._hands.values()) hand.removeAllFromScene();
    this._pool?.disposeAll();
    this._pile?.reset();
    this._turns?.reset();
    this._players.forEach(p => p.reset());
    this._hands.clear();
    this._state = STATE.IDLE;
    this._prevTopCard = null;
  }

  _setState(s) { this._state = s; if (DEBUG.ENABLED) console.log(`[GameManager] → ${s}`); }
  get state()  { return this._state; }
}
