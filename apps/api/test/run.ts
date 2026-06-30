/**
 * Lightweight test entrypoint. The project has no Jest setup, so we use Node's
 * built-in test runner (node:test) executed through ts-node. Each imported
 * *.spec file registers its tests via node:test, which run automatically.
 *
 * Run with: pnpm test
 */
import 'reflect-metadata'

import '../src/common/utils/money.spec'
import '../src/modules/plans/plans.service.spec'
import '../src/modules/portal/portal.service.spec'
