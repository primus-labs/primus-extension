/* global clearTimeout, setTimeout */
import { matchesTemplateId } from './templateIdUtils.js';

/** Login / register profile fields on Polymarket onboarding modals. */
export const POLYMARKET_LOGIN_FORM_SELECTOR =
  'input[name="username"], input[name="email"]';

/**
 * @param {Document} [doc]
 * @returns {boolean}
 */
export function isPolymarketLoginFormVisibleInDocument(doc = document) {
  try {
    return doc.querySelector(POLYMARKET_LOGIN_FORM_SELECTOR) != null;
  } catch (_e) {
    return false;
  }
}

export const TEMPLATE_ID = '9a93aeeb-99b0-4d5e-a49a-e71c7ddbd5bd';
export const displayName = 'Polymarket';

/** Form probe window after algorithm params are ready. */
export const POLYMARKET_FORM_PROBE_MS = 10_000;
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
  return Date.now() <= gate.formProbeStartedAt + POLYMARKET_FORM_PROBE_MS;
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
  return Date.now() >= gate.formProbeStartedAt + POLYMARKET_FORM_PROBE_MS;
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
export async function tryReleasePolymarketAttestation(state, finalizeWebRequestReady) {
  if (!matches(state.activeTemplate)) return;
  const gate = ensureGate(state);
  if (!shouldReleasePolymarketAttestation(gate)) {
    return;
  }
  gate.released = true;
  clearFormProbeTimer(gate);
  await finalizeWebRequestReady(state);
}

/**
 * @param {object} state
 * @param {() => Promise<void>} finalizeWebRequestReady
 */
export async function onPolymarketWebRequestCaptureComplete(
  state,
  finalizeWebRequestReady
) {
  if (!matches(state.activeTemplate)) {
    await finalizeWebRequestReady(state);
    return;
  }
  const gate = ensureGate(state);
  if (gate.paramsReady) {
    return;
  }
  gate.paramsReady = true;
  gate.formProbeStartedAt = Date.now();
  clearFormProbeTimer(gate);
  gate.timerId = setTimeout(() => {
    gate.timerId = null;
    tryReleasePolymarketAttestation(state, finalizeWebRequestReady).catch(
      (e) => {
        console.warn('[polymarketProfileGate] form probe deadline failed', e);
      }
    );
  }, POLYMARKET_FORM_PROBE_MS);
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
  await tryReleasePolymarketAttestation(state, finalizeWebRequestReady);
}
