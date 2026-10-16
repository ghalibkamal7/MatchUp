/**
 * src/core/StateManager.js
 * Generic finite state machine with overlay support.
 */

import { EventBus } from './EventBus.js';
import { DEBUG }    from '../utils/Constants.js';

const SM_EVENTS = Object.freeze({
  BEFORE_CHANGE:  'state:beforeChange',
  CHANGED:        'state:changed',
  OVERLAY_SET:    'state:overlaySet',
  OVERLAY_CLEAR:  'state:overlayClear',
  ERROR:          'state:error',
  RESET:          'state:reset',
});

class StateManager {
  constructor({ states, transitions, overlays = [], initial }) {
    this._validateConfig(states, transitions, overlays, initial);
    this._states      = [...states];
    this._transitions = { ...transitions };
    this._overlays    = [...overlays];
    this._current     = initial;
    this._overlay     = null;
    this._previous    = null;
    this._history     = [{ from: null, to: initial, timestamp: Date.now() }];
    this._maxHistory  = 50;
  }

  get current()    { return this._current; }
  get previous()   { return this._previous; }
  get overlay()    { return this._overlay; }
  get hasOverlay() { return this._overlay !== null; }
  get history()    { return [...this._history]; }

  transition(nextState) {
    if (this._overlay !== null)
      return this._error(`Cannot transition while overlay "${this._overlay}" is active.`);
    if (!this._isValidState(nextState))
      return this._error(`Unknown state: "${nextState}"`);
    if (!this._canTransitionTo(nextState))
      return this._error(`Illegal: "${this._current}" → "${nextState}"`);

    const from     = this._current;
    EventBus.emit(SM_EVENTS.BEFORE_CHANGE, { from, to: nextState });
    this._previous = this._current;
    this._current  = nextState;
    this._recordHistory(from, nextState);
    EventBus.emit(SM_EVENTS.CHANGED, { from, to: nextState, previous: this._previous });
    return true;
  }

  setOverlay(overlayState) {
    if (!this._overlays.includes(overlayState))
      return this._error(`"${overlayState}" is not a registered overlay.`);
    if (this._overlay !== null)
      return this._error(`Overlay "${this._overlay}" already active.`);
    this._overlay = overlayState;
    EventBus.emit(SM_EVENTS.OVERLAY_SET, { overlay: overlayState, primary: this._current });
    return true;
  }

  clearOverlay() {
    if (this._overlay === null) return this._error('No overlay active.');
    const cleared  = this._overlay;
    this._overlay  = null;
    EventBus.emit(SM_EVENTS.OVERLAY_CLEAR, { cleared, resuming: this._current });
    return true;
  }

  is(stateName)        { return this._current === stateName; }
  can(stateName)       { return this._overlay === null && this._canTransitionTo(stateName); }
  isOverlay(stateName) { return this._overlay === stateName; }

  reset(initialState) {
    if (!this._isValidState(initialState)) return this._error(`Unknown state: "${initialState}"`);
    const from    = this._current;
    this._current = initialState; this._previous = null;
    this._overlay = null; this._history = [{ from: null, to: initialState, timestamp: Date.now() }];
    EventBus.emit(SM_EVENTS.RESET, { from, to: initialState });
    return true;
  }

  _isValidState(name)     { return this._states.includes(name); }
  _canTransitionTo(next)  {
    const allowed = this._transitions[this._current];
    return Array.isArray(allowed) && allowed.includes(next);
  }
  _recordHistory(from, to) {
    this._history.push({ from, to, timestamp: Date.now() });
    if (this._history.length > this._maxHistory) this._history.shift();
  }
  _error(msg) {
    console.warn(`[StateManager] ${msg}`);
    EventBus.emit(SM_EVENTS.ERROR, { message: msg, current: this._current });
    return false;
  }
  _validateConfig(states, transitions, overlays, initial) {
    if (!Array.isArray(states) || !states.length)
      throw new TypeError('[StateManager] states must be non-empty array.');
    if (!states.includes(initial))
      throw new TypeError(`[StateManager] initial "${initial}" not in states.`);
  }
}

export { StateManager, SM_EVENTS };
