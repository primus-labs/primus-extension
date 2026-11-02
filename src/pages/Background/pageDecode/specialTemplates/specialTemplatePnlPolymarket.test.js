import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  POLYMARKET_FORM_PROBE_MS,
  shouldReleasePolymarketAttestation,
} from './specialTemplatePnlPolymarket.js';

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
