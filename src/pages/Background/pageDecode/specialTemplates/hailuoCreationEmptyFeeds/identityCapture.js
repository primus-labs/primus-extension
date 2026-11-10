import { fetchRequestData } from '../../utils';
import {
  IDENTITY_LOOKUP_HOST,
  IDENTITY_LOOKUP_PATH_MARKER,
} from './constants.js';

/**
 * @param {string | undefined} url
 */
export function isIdentityLookupUrl(url) {
  if (typeof url !== 'string' || !url) {
    return false;
  }
  return (
    url.includes(IDENTITY_LOOKUP_HOST) && url.includes(IDENTITY_LOOKUP_PATH_MARKER)
  );
}

/**
 * @param {Record<string, unknown>} requestsMap
 * @returns {{ requestId: string; entry: Record<string, unknown> } | null}
 */
export function findIdentityLookupInRequestsMap(requestsMap) {
  if (!requestsMap || typeof requestsMap !== 'object') {
    return null;
  }

  /** @type {{ requestId: string; entry: Record<string, unknown> } | null} */
  let preferred = null;
  /** @type {{ requestId: string; entry: Record<string, unknown> } | null} */
  let fallback = null;

  for (const [requestId, entry] of Object.entries(requestsMap)) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    if (!isIdentityLookupUrl(entry.url)) {
      continue;
    }
    if (entry.isTarget === 2) {
      continue;
    }
    const candidate = { requestId, entry };
    if (entry.responseData != null) {
      preferred = candidate;
      break;
    }
    if (entry.headers && !fallback) {
      fallback = candidate;
    }
  }

  return preferred ?? fallback;
}

/**
 * @param {Record<string, unknown> | null | undefined} entry
 * @returns {Promise<unknown | null>}
 */
export async function resolveIdentityLookupResponse(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }
  const existing = entry.responseData;
  if (existing != null && typeof existing === 'object') {
    return existing;
  }
  if (typeof entry.url !== 'string' || !entry.url) {
    return null;
  }
  const headers = entry.headers;
  if (!headers || typeof headers !== 'object') {
    return null;
  }
  try {
    const replay = await fetchRequestData({
      url: entry.url,
      method: entry.method || 'POST',
      header: headers,
      body: entry.body,
      isFormData: entry.isFormData === true,
    });
    return replay ?? null;
  } catch {
    return null;
  }
}
