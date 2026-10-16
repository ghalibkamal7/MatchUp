/**
 * src/core/EventBus.js
 * Global pub/sub event system — nervous system of MatchUp.
 */

import { DEBUG } from '../utils/Constants.js';

const listeners = new Map();

function getListeners(event) {
  if (!listeners.has(event)) listeners.set(event, []);
  return listeners.get(event);
}

function validateEvent(event) {
  if (typeof event !== 'string' || event.trim() === '')
    throw new TypeError(`[EventBus] Event must be non-empty string. Got: ${JSON.stringify(event)}`);
}

function validateHandler(handler) {
  if (typeof handler !== 'function')
    throw new TypeError(`[EventBus] Handler must be a function. Got: ${typeof handler}`);
}

const EventBus = {
  on(event, handler, options = {}) {
    validateEvent(event); validateHandler(handler);
    getListeners(event).push({ handler, once: false, owner: options.owner ?? null });
    if (DEBUG.LOG_EVENTS) console.log(`[EventBus] on("${event}")`);
    return () => this.off(event, handler);
  },

  once(event, handler, options = {}) {
    validateEvent(event); validateHandler(handler);
    getListeners(event).push({ handler, once: true, owner: options.owner ?? null });
    return () => this.off(event, handler);
  },

  off(event, handler) {
    validateEvent(event); validateHandler(handler);
    if (!listeners.has(event)) return;
    const updated = listeners.get(event).filter(r => r.handler !== handler);
    updated.length === 0 ? listeners.delete(event) : listeners.set(event, updated);
  },

  emit(event, payload) {
    validateEvent(event);
    if (!listeners.has(event)) return;
    if (DEBUG.LOG_EVENTS) console.log(`[EventBus] emit("${event}")`, payload ?? '');
    const snapshot  = [...listeners.get(event)];
    const remaining = snapshot.filter(r => !r.once);
    remaining.length === 0 ? listeners.delete(event) : listeners.set(event, remaining);
    for (const record of snapshot) {
      try { record.handler(payload); }
      catch (err) { console.error(`[EventBus] Error in handler for "${event}":`, err); }
    }
  },

  clear(event) {
    validateEvent(event);
    listeners.delete(event);
  },

  clearOwner(owner) {
    if (typeof owner !== 'string' || !owner.trim())
      throw new TypeError(`[EventBus] Owner must be non-empty string.`);
    for (const [event, records] of listeners.entries()) {
      const filtered = records.filter(r => r.owner !== owner);
      filtered.length === 0 ? listeners.delete(event) : listeners.set(event, filtered);
    }
  },

  reset() {
    listeners.clear();
  },

  debug() {
    if (!DEBUG.ENABLED) return;
    const report = {};
    for (const [event, records] of listeners.entries()) {
      report[event] = { count: records.length, owners: records.map(r => r.owner ?? 'anon') };
    }
    console.table(report);
    return report;
  },
};

Object.freeze(EventBus);
export { EventBus };
