/**
 * src/core/SaveMigration.js
 * Save data version migrations — add new entries when schema changes.
 */

import { DEBUG } from '../utils/Constants.js';

// MIGRATIONS[category][fromVersion] = (oldData) => newData
const MIGRATIONS = {
  settings: {}, profile: {}, statistics: {}, coins: {}, xp: {},
  achievements: {}, collection: {}, environments: {}, audio: {},
  tutorial: {}, daily: {}, history: {},
};

const SaveMigration = {
  migrate(category, data, fromVersion, toVersion) {
    let current = { ...data };
    for (let v = fromVersion; v < toVersion; v++) {
      const fn = MIGRATIONS[category]?.[v];
      if (typeof fn === 'function') {
        current = fn(current);
        if (DEBUG.ENABLED) console.log(`[SaveMigration] "${category}" v${v}→v${v+1}`);
      }
    }
    return current;
  },
  needsMigration(category, savedVersion, currentVersion) {
    return savedVersion < currentVersion;
  },
};

export { SaveMigration };
