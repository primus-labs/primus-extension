// src/pages/Background/padoZKAttestationJSSDK/algorithmInitialization.test.js

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ensureAlgorithmDocument } from './algorithmInitialization.js';

describe('SDK algorithm initialization lifecycle', () => {
  it('initializes an existing document for the newly active SDK client', async () => {
    const calls = [];
    const result = await ensureAlgorithmDocument({
      hasDocument: async () => true,
      createDocument: async () => calls.push('create'),
      initializeExisting: async () => calls.push('init-network-sdk'),
      ensureInitialization: true,
    });

    assert.deepEqual(calls, ['init-network-sdk']);
    assert.deepEqual(result, { created: false, initialized: true });
  });

  it('does not reinitialize unrelated existing-document start flows', async () => {
    const calls = [];
    const result = await ensureAlgorithmDocument({
      hasDocument: async () => true,
      createDocument: async () => calls.push('create'),
      initializeExisting: async () => calls.push('init'),
      ensureInitialization: false,
    });

    assert.deepEqual(calls, []);
    assert.deepEqual(result, { created: false, initialized: false });
  });

  it('waits for a new document runtime to request its initial init', async () => {
    const calls = [];
    const result = await ensureAlgorithmDocument({
      hasDocument: async () => false,
      createDocument: async () => calls.push('create'),
      initializeExisting: async () => calls.push('init-too-early'),
      ensureInitialization: true,
    });

    assert.deepEqual(calls, ['create']);
    assert.deepEqual(result, { created: true, initialized: false });
  });

  it('refreshes clientType as initialized tabs alternate proofs', async () => {
    const initializedClientTypes = [];
    const startForClient = (clientType) =>
      ensureAlgorithmDocument({
        hasDocument: async () => true,
        createDocument: async () => {},
        initializeExisting: async () => {
          initializedClientTypes.push(clientType);
        },
        ensureInitialization: true,
      });

    await startForClient('@primuslabs/js-sdk');
    await startForClient('@primuslabs/network-sdk');

    assert.deepEqual(initializedClientTypes, [
      '@primuslabs/js-sdk',
      '@primuslabs/network-sdk',
    ]);
  });
});
