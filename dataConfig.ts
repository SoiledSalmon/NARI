/**
 * dataConfig.ts — Single source of truth for which data provider to use.
 *
 * Phase 2: MockDataProvider (simulated data, demo mode)
 * Phase 3+: Switch to LiveDataProvider
 *
 * Import `dataProvider` anywhere you need data.
 */

import { IDataProvider } from './src/data/providers/DataProvider';
import { MockDataProvider } from './src/data/providers/MockDataProvider';

// Toggle this when moving to production data sources:
const USE_MOCK = true;

function createProvider(): IDataProvider {
  if (USE_MOCK) {
    return new MockDataProvider();
  }

  // Phase 3+: return new LiveDataProvider();
  return new MockDataProvider();
}

/** The global data provider singleton. */
export const dataProvider: IDataProvider = createProvider();
