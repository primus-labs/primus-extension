import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  authorizeSdkMessage,
  createSdkOwnershipErrorMessage,
} from './sdkMessageOwnership.js';

describe('SDK message ownership routing', () => {
  it('emits one visible failure and one ACK for a blocked start', async () => {
    const visibleFailures = [];
    const acknowledgements = [];
    const authorized = await authorizeSdkMessage({
      name: 'startAttestation',
      senderTabId: 21,
      ownerTabId: 20,
      onBlocked: async (hasOwner) => {
        visibleFailures.push(hasOwner);
      },
      respond: (payload) => {
        acknowledgements.push(payload);
      },
    });

    assert.equal(authorized, false);
    assert.deepEqual(visibleFailures, [true]);
    assert.deepEqual(acknowledgements, [{ ok: false }]);
  });

  it('allows the initialized owner without failure or early ACK', async () => {
    let blocked = false;
    let responded = false;
    const authorized = await authorizeSdkMessage({
      name: 'startAttestation',
      senderTabId: 20,
      ownerTabId: 20,
      onBlocked: async () => {
        blocked = true;
      },
      respond: () => {
        responded = true;
      },
    });

    assert.equal(authorized, true);
    assert.equal(blocked, false);
    assert.equal(responded, false);
  });

  it('creates SDK-visible init and start ownership errors', () => {
    const initError = createSdkOwnershipErrorMessage(
      'initAttestation',
      true
    );
    assert.equal(initError.name, 'initAttestationRes');
    assert.equal(initError.params.errorData.code, '00003');

    const startError = createSdkOwnershipErrorMessage(
      'startAttestation',
      false
    );
    assert.equal(startError.name, 'startAttestationRes');
    assert.equal(startError.params.errorData.code, '00001');
  });
});
