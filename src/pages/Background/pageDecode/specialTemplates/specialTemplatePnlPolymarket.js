/* global clearTimeout, setTimeout */
import { matchesTemplateId } from './templateIdUtils.js';

export const TEMPLATE_ID = '9a93aeeb-99b0-4d5e-a49a-e71c7ddbd5bd';
export const displayName = 'Polymarket';

/** Filter console with this tag when debugging Polymarket PnL profile gate. */
export const POLYMARKET_PNL_LOG_TAG = 'PolymarketPnl';

/**
 * @param {string} event
 * @param {Record<string, unknown>} [detail]
 */
export function logPolymarketPnl(_event, _detail = {}) {
  /* debug logging disabled */
}

/** Default form probe window after algorithm params are ready (ms). */
export const POLYMARKET_FORM_PROBE_MS = 10_000;
export const POLYMARKET_EXTENDED_PARAM_WAIT_FOR_USERNAME_INPUT =
  'polymarketPnlWaitForUsernameInput';

/**
 * @param {{ extendedParams?: string | object; extendedParamsObj?: object } | null | undefined} activeTemplate
 * @returns {Record<string, unknown>}
 */
function getExtendedParamsObj(activeTemplate) {
  if (!activeTemplate) return {};
  if (
    activeTemplate.extendedParamsObj &&
    typeof activeTemplate.extendedParamsObj === 'object' &&
    !Array.isArray(activeTemplate.extendedParamsObj)
  ) {
    return activeTemplate.extendedParamsObj;
  }
  const raw = activeTemplate.extendedParams;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (_e) {
      /* ignore */
    }
    return {};
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw;
  }
  return {};
}

/**
 * SDK extendedParams.polymarketPnlWaitForUsernameInput (ms); falls back to POLYMARKET_FORM_PROBE_MS.
 * @param {{ extendedParams?: string | object; extendedParamsObj?: object } | null | undefined} activeTemplate
 * @returns {number}
 */
export function getPolymarketFormProbeMs(activeTemplate) {
  const ms = getExtendedParamsObj(activeTemplate)[
    POLYMARKET_EXTENDED_PARAM_WAIT_FOR_USERNAME_INPUT
  ];
  if (typeof ms === 'number' && Number.isFinite(ms) && ms > 0) {
    return ms;
  }
  if (typeof ms === 'string' && ms.trim()) {
    const parsed = Number(ms);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return POLYMARKET_FORM_PROBE_MS;
}

/**
 * @param {ReturnType<typeof ensureGate>} gate
 * @returns {number}
 */
function formProbeDurationMsForGate(gate) {
  if (
    typeof gate.formProbeDurationMs === 'number' &&
    Number.isFinite(gate.formProbeDurationMs) &&
    gate.formProbeDurationMs > 0
  ) {
    return gate.formProbeDurationMs;
  }
  return POLYMARKET_FORM_PROBE_MS;
}

export const POLYMARKET_USERS_ME_PUT_URL =
  'https://gamma-api.polymarket.com/v1/users/me';

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {boolean}
 */
export function matches(activeTemplate) {
  return matchesTemplateId(activeTemplate, TEMPLATE_ID);
}

export const hooks = {
  pageDecodeModal: {
    darkTheme: false,
    placement: 'center',
  },
  jsonPath: { truncateAtEmptyArray: true },
};

/**
 * @param {import('../state.js').createPageDecodeState extends () => infer R ? R['state'] : never} state
 */
function ensureGate(state) {
  if (!state.polymarketProfileGate) {
    state.polymarketProfileGate = {
      formProbeStartedAt: null,
      loginFormSeen: false,
      usersMePutSeen: false,
      paramsReady: false,
      released: false,
      timerId: null,
    };
  }
  return state.polymarketProfileGate;
}

export function resetPolymarketProfileGate(state) {
  const gate = state.polymarketProfileGate;
  if (!gate) return;
  if (gate.timerId != null) {
    clearTimeout(gate.timerId);
  }
  delete state.polymarketProfileGate;
}

/**
 * @param {string} method
 * @param {string} url
 */
export function isPolymarketUsersMePutRequest(method, url) {
  if (String(method || '').toUpperCase() !== 'PUT') return false;
  try {
    const parsed = new URL(url);
    const normalized = `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '');
    const expected = POLYMARKET_USERS_ME_PUT_URL.replace(/\/$/, '');
    return normalized === expected;
  } catch (_e) {
    return false;
  }
}

/**
 * @param {ReturnType<typeof ensureGate>} gate
 */
function isWithinFormProbeWindow(gate) {
  if (gate.formProbeStartedAt == null) return false;
  return (
    Date.now() <=
    gate.formProbeStartedAt + formProbeDurationMsForGate(gate)
  );
}

/**
 * @param {ReturnType<typeof ensureGate>} gate
 * @returns {boolean}
 */
export function shouldReleasePolymarketAttestation(gate) {
  if (gate.released || !gate.paramsReady) {
    return false;
  }
  if (gate.loginFormSeen) {
    return gate.usersMePutSeen === true;
  }
  if (gate.formProbeStartedAt == null) {
    return false;
  }
  return (
    Date.now() >=
    gate.formProbeStartedAt + formProbeDurationMsForGate(gate)
  );
}

/**
 * @param {{ activeTemplate?: object; polymarketProfileGate?: ReturnType<typeof ensureGate> } | null | undefined} state
 * @returns {boolean}
 */
export function isPolymarketFormProbeActive(state) {
  if (!matches(state?.activeTemplate)) return false;
  const gate = state?.polymarketProfileGate;
  if (!gate?.paramsReady || gate.released || gate.loginFormSeen) return false;
  return gate.formProbeStartedAt != null;
}

/**
 * UI hint for content modal while gate holds auto-start after params are ready.
 * @param {{ activeTemplate?: object; polymarketProfileGate?: ReturnType<typeof ensureGate> } | null | undefined} state
 * @returns {boolean}
 */
export function isPolymarketGateAwaitingProfile(state) {
  if (!matches(state?.activeTemplate)) return false;
  const gate = state?.polymarketProfileGate;
  if (!gate?.paramsReady || gate.released) return false;
  return gate.loginFormSeen === true && gate.usersMePutSeen !== true;
}

/**
 * Algorithm not released yet after all template requests are captured.
 * @param {{ activeTemplate?: object; polymarketProfileGate?: ReturnType<typeof ensureGate> } | null | undefined} state
 * @returns {boolean}
 */
export function isPolymarketProfileGateHolding(state) {
  if (!matches(state?.activeTemplate)) return false;
  const gate = state?.polymarketProfileGate;
  if (!gate?.paramsReady || gate.released) return false;
  return true;
}

/**
 * Show "Verifying …" subtitle while gate holds and profile form not yet seen.
 * @param {{ activeTemplate?: object; polymarketProfileGate?: ReturnType<typeof ensureGate> } | null | undefined} state
 * @returns {boolean}
 */
export function isPolymarketShowVerifyingSubtitle(state) {
  if (!isPolymarketProfileGateHolding(state)) return false;
  return !isPolymarketGateAwaitingProfile(state);
}

/**
 * Hide Data Verification modal on the data source tab (content unmounts PadoCard).
 * @param {{ activeTemplate?: object; polymarketProfileGate?: ReturnType<typeof ensureGate> } | null | undefined} state
 * @returns {boolean}
 */
export function isPolymarketHideDataVerificationModal(state) {
  if (!matches(state?.activeTemplate)) return false;
  const gate = state?.polymarketProfileGate;
  if (!gate?.paramsReady) return true;
  if (gate.released) return false;
  if (gate.loginFormSeen && !gate.usersMePutSeen) return true;
  return false;
}

/**
 * @param {{ activeTemplate?: object; polymarketProfileGate?: ReturnType<typeof ensureGate> } | null | undefined} state
 */
export function getPolymarketGateUiPayload(state) {
  if (!matches(state?.activeTemplate)) {
    return {
      polymarketProfileGateHolding: false,
      polymarketShowVerifyingSubtitle: false,
      polymarketGateAwaitingProfile: false,
      polymarketHideDataVerificationModal: false,
      isReady: false,
    };
  }
  return {
    polymarketProfileGateHolding: isPolymarketProfileGateHolding(state),
    polymarketShowVerifyingSubtitle: isPolymarketShowVerifyingSubtitle(state),
    polymarketGateAwaitingProfile: isPolymarketGateAwaitingProfile(state),
    polymarketHideDataVerificationModal:
      isPolymarketHideDataVerificationModal(state),
    isReady: !!state?.isReadyRequest,
    phase: state?.phase,
  };
}

/**
 * @param {{ activeTemplate?: object; polymarketProfileGate?: ReturnType<typeof ensureGate> } | null | undefined} state
 */
export function buildPolymarketGateUiSyncMessage(state) {
  return {
    type: 'pageDecode',
    name: 'polymarketGateUiSync',
    ...getPolymarketGateUiPayload(state),
  };
}

function clearFormProbeTimer(gate) {
  if (gate.timerId != null) {
    clearTimeout(gate.timerId);
    gate.timerId = null;
  }
}

/**
 * @param {object} state pageDecode state
 * @param {() => Promise<void>} finalizeWebRequestReady
 */
function polymarketReleaseReason(gate) {
  if (!gate.loginFormSeen) {
    return 'formProbeDeadlineWithoutLoginForm';
  }
  if (gate.usersMePutSeen) {
    return 'usersMePutAfterLoginForm';
  }
  return 'unexpected';
}

export async function tryReleasePolymarketAttestation(state, finalizeWebRequestReady) {
  if (!matches(state.activeTemplate)) return;
  const gate = ensureGate(state);
  if (!shouldReleasePolymarketAttestation(gate)) {
    logPolymarketPnl('attestationReleaseSkipped', {
      paramsReady: gate.paramsReady,
      released: gate.released,
      loginFormSeen: gate.loginFormSeen,
      usersMePutSeen: gate.usersMePutSeen,
      formProbeStartedAt: gate.formProbeStartedAt,
      formProbeDurationMs: formProbeDurationMsForGate(gate),
      msSinceProbeStart:
        gate.formProbeStartedAt != null
          ? Date.now() - gate.formProbeStartedAt
          : null,
    });
    return;
  }
  logPolymarketPnl('attestationRelease', {
    reason: polymarketReleaseReason(gate),
    loginFormSeen: gate.loginFormSeen,
    usersMePutSeen: gate.usersMePutSeen,
    formProbeDurationMs: formProbeDurationMsForGate(gate),
    msSinceProbeStart:
      gate.formProbeStartedAt != null
        ? Date.now() - gate.formProbeStartedAt
        : null,
  });
  gate.released = true;
  clearFormProbeTimer(gate);
  await finalizeWebRequestReady(state);
}

/**
 * @param {object} state
 * @param {() => Promise<void>} finalizeWebRequestReady
 * @param {{ notifyGateUiSync?: () => Promise<void> }} [options]
 */
export async function onPolymarketWebRequestCaptureComplete(
  state,
  finalizeWebRequestReady,
  options = {}
) {
  const { notifyGateUiSync } = options;
  if (!matches(state.activeTemplate)) {
    await finalizeWebRequestReady(state);
    return;
  }
  const gate = ensureGate(state);
  if (gate.paramsReady) {
    return;
  }
  logPolymarketPnl('allTemplateRequestsCaptured');
  gate.paramsReady = true;
  gate.formProbeDurationMs = getPolymarketFormProbeMs(state.activeTemplate);
  gate.formProbeStartedAt = Date.now();
  logPolymarketPnl('formProbeStarted', {
    polymarketPnlWaitForUsernameInputMs: gate.formProbeDurationMs,
    formProbeStartedAt: gate.formProbeStartedAt,
  });
  clearFormProbeTimer(gate);
  gate.timerId = setTimeout(() => {
    gate.timerId = null;
    void (async () => {
      logPolymarketPnl('formProbeTimerFired', {
        formProbeDurationMs: gate.formProbeDurationMs,
        loginFormSeen: gate.loginFormSeen,
        usersMePutSeen: gate.usersMePutSeen,
      });
      try {
        await notifyGateUiSync?.();
      } catch (e) {
        console.warn('[polymarketProfileGate] gate UI sync failed', e);
      }
      try {
        await tryReleasePolymarketAttestation(state, finalizeWebRequestReady);
      } catch (e) {
        console.warn('[polymarketProfileGate] form probe deadline failed', e);
      }
    })();
  }, gate.formProbeDurationMs);
}

/**
 * @param {ReturnType<typeof ensureGate>} gate
 */
export function buildPolymarketFormProbeStartedMessage(gate) {
  return {
    type: 'pageDecode',
    name: 'polymarketFormProbeStarted',
    formProbeStartedAt: gate.formProbeStartedAt,
    formProbeDurationMs: gate.formProbeDurationMs,
  };
}

/**
 * @param {object} state
 * @param {() => Promise<void>} finalizeWebRequestReady
 */
export async function onPolymarketLoginFormSeen(state, finalizeWebRequestReady) {
  if (!matches(state.activeTemplate)) return;
  const gate = ensureGate(state);
  if (!gate.paramsReady || gate.loginFormSeen) return;
  if (!isWithinFormProbeWindow(gate)) return;
  gate.loginFormSeen = true;
  logPolymarketPnl('loginFormSeenBackground', {
    msSinceProbeStart:
      gate.formProbeStartedAt != null
        ? Date.now() - gate.formProbeStartedAt
        : null,
  });
  clearFormProbeTimer(gate);
  await tryReleasePolymarketAttestation(state, finalizeWebRequestReady);
}

/**
 * @param {object} state
 * @param {string} method
 * @param {string} url
 * @param {() => Promise<void>} finalizeWebRequestReady
 */
export async function onPolymarketUsersMePutObserved(
  state,
  method,
  url,
  finalizeWebRequestReady
) {
  if (!matches(state.activeTemplate)) return;
  if (!isPolymarketUsersMePutRequest(method, url)) return;
  const gate = ensureGate(state);
  gate.usersMePutSeen = true;
  logPolymarketPnl('usersMePutIntercepted', {
    method,
    url,
    loginFormSeen: gate.loginFormSeen,
    paramsReady: gate.paramsReady,
    msSinceProbeStart:
      gate.formProbeStartedAt != null
        ? Date.now() - gate.formProbeStartedAt
        : null,
  });
  await tryReleasePolymarketAttestation(state, finalizeWebRequestReady);
}
