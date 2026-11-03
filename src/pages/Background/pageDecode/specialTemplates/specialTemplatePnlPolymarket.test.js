import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TEMPLATE_ID,
  POLYMARKET_FORM_PROBE_MS,
  getPolymarketFormProbeMs,
  shouldReleasePolymarketAttestation,
  isPolymarketProfileGateHolding,
  isPolymarketShowVerifyingSubtitle,
  isPolymarketHideDataVerificationModal,
  getPolymarketGateUiPayload,
} from './specialTemplatePnlPolymarket.js';

const PM_TEMPLATE = { attTemplateID: TEMPLATE_ID };

function stateWithGate(gateOverrides = {}) {
  return {
    activeTemplate: PM_TEMPLATE,
    polymarketProfileGate: gate({ paramsReady: true, ...gateOverrides }),
  };
}

function gate(overrides = {}) {
  return {
    formProbeStartedAt: Date.now(),
    loginFormSeen: false,
    usersMePutSeen: false,
    paramsReady: false,
    released: false,
    timerId: null,
    ...overrides,
  };
}

describe('Polymarket gate UI helpers', () => {
  it('profile gate holding when paramsReady and not released', () => {
    assert.equal(isPolymarketProfileGateHolding(stateWithGate()), true);
  });

  it('not holding when released or params not ready', () => {
    assert.equal(
      isPolymarketProfileGateHolding(stateWithGate({ released: true })),
      false
    );
    assert.equal(
      isPolymarketProfileGateHolding({
        activeTemplate: PM_TEMPLATE,
        polymarketProfileGate: gate({ paramsReady: false }),
      }),
      false
    );
    assert.equal(isPolymarketProfileGateHolding({ activeTemplate: {} }), false);
  });

  it('show Verifying subtitle during probe before login form', () => {
    assert.equal(
      isPolymarketShowVerifyingSubtitle(
        stateWithGate({ loginFormSeen: false })
      ),
      true
    );
  });

  it('hide Verifying subtitle when awaiting profile PUT', () => {
    assert.equal(
      isPolymarketShowVerifyingSubtitle(
        stateWithGate({ loginFormSeen: true, usersMePutSeen: false })
      ),
      false
    );
  });

  it('getPolymarketGateUiPayload bundles flags for non-Polymarket template', () => {
    assert.deepEqual(getPolymarketGateUiPayload({ activeTemplate: {} }), {
      polymarketProfileGateHolding: false,
      polymarketShowVerifyingSubtitle: false,
      polymarketGateAwaitingProfile: false,
      polymarketHideDataVerificationModal: false,
      isReady: false,
    });
  });

  it('getPolymarketGateUiPayload includes isReady and phase after gate release', () => {
    const payload = getPolymarketGateUiPayload({
      activeTemplate: PM_TEMPLATE,
      isReadyRequest: true,
      phase: 'ready',
      polymarketProfileGate: gate({
        paramsReady: true,
        loginFormSeen: true,
        usersMePutSeen: true,
        released: true,
      }),
    });
    assert.equal(payload.isReady, true);
    assert.equal(payload.phase, 'ready');
    assert.equal(payload.polymarketHideDataVerificationModal, false);
  });
});

/**
 * Manual QA (content visual hide): capture complete → Verifying shown; email input → modal
 * invisible but mounted; after PUT /v1/users/me → modal visible with Verifying + attestation start.
 */
describe('Polymarket modal visibility', () => {
  it('hides modal before all requests captured', () => {
    assert.equal(
      isPolymarketHideDataVerificationModal({
        activeTemplate: PM_TEMPLATE,
        polymarketProfileGate: gate({ paramsReady: false }),
      }),
      true
    );
    assert.equal(
      isPolymarketHideDataVerificationModal({ activeTemplate: PM_TEMPLATE }),
      true
    );
  });

  it('shows modal during probe when login form not seen', () => {
    assert.equal(
      isPolymarketHideDataVerificationModal(
        stateWithGate({ loginFormSeen: false })
      ),
      false
    );
  });

  it('hides modal after login form seen until PUT', () => {
    assert.equal(
      isPolymarketHideDataVerificationModal(
        stateWithGate({ loginFormSeen: true, usersMePutSeen: false })
      ),
      true
    );
  });

  it('shows modal after PUT or gate released', () => {
    assert.equal(
      isPolymarketHideDataVerificationModal(
        stateWithGate({ loginFormSeen: true, usersMePutSeen: true })
      ),
      false
    );
    assert.equal(
      isPolymarketHideDataVerificationModal(
        stateWithGate({ released: true, loginFormSeen: true })
      ),
      false
    );
  });

  it('does not hide modal for other templates', () => {
    assert.equal(
      isPolymarketHideDataVerificationModal({ activeTemplate: {} }),
      false
    );
  });
});

describe('getPolymarketFormProbeMs', () => {
  it('defaults when extendedParams omits polymarketPnlWaitForUsernameInput', () => {
    assert.equal(getPolymarketFormProbeMs({}), POLYMARKET_FORM_PROBE_MS);
  });

  it('reads polymarketPnlWaitForUsernameInput from extendedParams JSON string', () => {
    assert.equal(
      getPolymarketFormProbeMs({
        extendedParams: JSON.stringify({
          polymarketPnlWaitForUsernameInput: 15_000,
        }),
      }),
      15_000
    );
  });

  it('reads polymarketPnlWaitForUsernameInput from extendedParams object', () => {
    assert.equal(
      getPolymarketFormProbeMs({
        extendedParams: { polymarketPnlWaitForUsernameInput: 8000 },
      }),
      8000
    );
  });
});

describe('shouldReleasePolymarketAttestation', () => {
  it('does not release without paramsReady', () => {
    assert.equal(
      shouldReleasePolymarketAttestation(
        gate({
          paramsReady: false,
          formProbeStartedAt: Date.now() - 60_000,
        })
      ),
      false
    );
  });

  it('does not release when already released', () => {
    assert.equal(
      shouldReleasePolymarketAttestation(
        gate({ paramsReady: true, released: true })
      ),
      false
    );
  });

  it('does not release during form probe when login form was not seen', () => {
    assert.equal(
      shouldReleasePolymarketAttestation(
        gate({ paramsReady: true, formProbeStartedAt: Date.now() })
      ),
      false
    );
  });

  it('releases after form probe deadline when login form was not seen', () => {
    const formProbeStartedAt = Date.now() - POLYMARKET_FORM_PROBE_MS - 1;
    assert.equal(
      shouldReleasePolymarketAttestation(
        gate({ paramsReady: true, formProbeStartedAt, loginFormSeen: false })
      ),
      true
    );
  });

  it('uses gate formProbeDurationMs for release deadline', () => {
    const duration = 5000;
    const formProbeStartedAt = Date.now() - duration - 1;
    assert.equal(
      shouldReleasePolymarketAttestation(
        gate({
          paramsReady: true,
          formProbeStartedAt,
          formProbeDurationMs: duration,
          loginFormSeen: false,
        })
      ),
      true
    );
  });

  it('holds until PUT when login form was seen', () => {
    assert.equal(
      shouldReleasePolymarketAttestation(
        gate({
          paramsReady: true,
          loginFormSeen: true,
          usersMePutSeen: false,
        })
      ),
      false
    );
    assert.equal(
      shouldReleasePolymarketAttestation(
        gate({
          paramsReady: true,
          loginFormSeen: true,
          usersMePutSeen: true,
        })
      ),
      true
    );
  });

  it('does not release when paramsReady but probe never started', () => {
    assert.equal(
      shouldReleasePolymarketAttestation(
        gate({ paramsReady: true, formProbeStartedAt: null })
      ),
      false
    );
  });
});
