/* global require, chrome, console, FormData, TextDecoder, Promise, fetch */
import jp from 'jsonpath';
const { select } = require('xpath');
const { DOMParser } = require('xmldom');
const cheerio = require('cheerio');

import {
  SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
  SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
} from '@/config/constants';
import { customFetch2, customFetch2WithMeta } from '../utils/request';
import { safeStorageRemove } from '@/utils/safeStorage';
import {
  clearSdkAttestationResultCache,
  clearSdkAttestationPreset,
  clearSdkAttestationSession,
  getSdkAttestationSession,
} from '../padoZKAttestationJSSDK/sessionStorage.js';
import { createTabMessageSender } from '../utils/msgTransfer.js';
import { getPageDecodeState } from './state';

/** Fetch request data (JSON/object) for template matching. Re-sends captured request. */
export const fetchRequestData = async (params) => {
  try {
    const { ...requestParams } = params;
    const requestRes = await customFetch2(requestParams);
    if (typeof requestRes === 'object' && requestRes !== null) {
      return requestRes;
    }
  } catch (e) {
    console.log('fetch custom request error', e);
  }
};

/** Re-send captured request and return body + Content-Type (for template validation routing). */
export async function fetchRequestDataForTemplateValidation(params) {
  try {
    const { ...requestParams } = params;
    return await customFetch2WithMeta(requestParams);
  } catch (e) {
    console.log('fetchRequestDataForTemplateValidation error', e);
    return null;
  }
}

/**
 * Prefer XPath/HTML validation when the replayed response is HTML, even if webRequest type is not main_frame
 * (e.g. fetch/XHR that returns text/html).
 */
export function shouldTreatFetchedBodyAsHtmlForValidation(contentType, data) {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('text/html') || ct.includes('application/xhtml')) return true;
  if (
    typeof data === 'string' &&
    /^\s*</.test(data) &&
    /<\s*html[\s>]/i.test(data)
  ) {
    return true;
  }
  return false;
}

/** Fetch HTML content for main_frame requests. Used for XPath/HTML condition checks. */
export const fetchHtmlContent = async (params) => {
  const { url, method, headers, body: requestBody } = params;

  let body = null;
  if (method.toUpperCase() !== 'GET' && requestBody?.formData) {
    // form data（multipart/form-data or application/x-www-form-urlencoded）
    const formData = new FormData();
    for (const [key, values] of Object.entries(requestBody.formData)) {
      values.forEach((value) => formData.append(key, value));
    }
    body = formData;
  } else if (method.toUpperCase() !== 'GET' && requestBody?.raw) {
    // Process raw data (such as JSON, text, etc.)
    // Convert ArrayBuffer to Uint8Array and then to string
    body = new TextDecoder().decode(requestBody.raw[0].bytes);
  }

  const fetchOptions = {
    method: method,
    headers: headers,
    body: body,
    credentials: 'include',
    redirect: 'follow',
    cache: 'no-store',
    mode: 'cors',
  };

  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      resolve({
        data: html,
        finalUrl: response.url,
      });

      // resolve({
      //   success: true,
      //   html: html,
      //   status: response.status,
      //   headers: response.headers,
      // });
    } catch (error) {
      console.error('Failed to resend the HTML request:', error);
      reject(error);
      // reject({
      //   success: false,
      //   error: error.message,
      // });
    }
  });
};

/** Send attestation error to dapp tab and optionally remove storage / close data source tab. */
export const handleAttestationError = async (errorData, dataSourcePageTabId, options = {}) => {
  let resParams = {
    result: false,
    errorData,
  };
  const session = await getSdkAttestationSession();
  const sendToSdk = createTabMessageSender(session?.ownerTabId);
  await sendToSdk({
    type: 'padoZKAttestationJSSDK',
    name: 'getAttestationRes',
    params: resParams,
  });

  const keysToRemove = [
    SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
    SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
  ];
  if (!options.skipRemoveActiveRequestAttestation) {
    keysToRemove.push('activeRequestAttestation');
  }
  await safeStorageRemove(keysToRemove);
  await clearSdkAttestationResultCache();
  await clearSdkAttestationSession();
  await clearSdkAttestationPreset();
  if (dataSourcePageTabId) {
    const { state } = getPageDecodeState();
    if (dataSourcePageTabId === state.dataSourcePageTabId) {
      state.skipCancelOnNextDataSourceTabRemoved = true;
    }
    await chrome.tabs.remove(dataSourcePageTabId);
  }
};

/**
 * Request-body field path (Primus algorithm convention), not JSONPath on response.
 * Pre-attestation checks only replayed response JSON — skip these paths (treat as present).
 */
export function isRequestBodyValidationPath(path) {
  return typeof path === 'string' && path.startsWith('^.');
}

/** Matches `[-1]` style indices, not slice syntax like `[-1:]`. */
const NEGATIVE_ARRAY_INDEX_RE = /\[(-\d+)\](?!:)/;

export const pathHasNegativeArrayIndex = (pathExpr) =>
  typeof pathExpr === 'string' && NEGATIVE_ARRAY_INDEX_RE.test(pathExpr);

export const resolveNegativeJsonPathIndices = (pathExpr, rootData) => {
  if (typeof pathExpr !== 'string' || !pathHasNegativeArrayIndex(pathExpr)) {
    return { ok: true, path: pathExpr };
  }

  let path = pathExpr;
  let guard = 0;
  const maxIterations = 50;

  while (NEGATIVE_ARRAY_INDEX_RE.test(path)) {
    if (guard >= maxIterations) {
      return { ok: false, reason: 'OUT_OF_RANGE' };
    }
    guard += 1;

    const match = path.match(NEGATIVE_ARRAY_INDEX_RE);
    const negativeIndex = parseInt(match[1], 10);
    const bracketStart = match.index;
    const prefix = path.slice(0, bracketStart);
    const suffix = path.slice(bracketStart + match[0].length);

    let nodes;
    try {
      nodes = jp.query(rootData, prefix);
    } catch {
      return { ok: false, reason: 'PREFIX_NOT_FOUND' };
    }

    if (!nodes.length) {
      return { ok: false, reason: 'PREFIX_NOT_FOUND' };
    }

    const target = nodes[0];
    if (target == null) {
      return { ok: false, reason: 'EMPTY_OR_NULL' };
    }
    if (!Array.isArray(target)) {
      return { ok: false, reason: 'NOT_ARRAY' };
    }
    if (target.length === 0) {
      return { ok: false, reason: 'EMPTY_ARRAY' };
    }

    const positiveIndex = target.length + negativeIndex;
    if (positiveIndex < 0 || positiveIndex >= target.length) {
      return { ok: false, reason: 'OUT_OF_RANGE' };
    }

    path = `${prefix}[${positiveIndex}]${suffix}`;
  }

  return { ok: true, path };
};

export const queryJsonPathWithNegativeIndices = (pathExpr, rootData) => {
  const resolved = resolveNegativeJsonPathIndices(pathExpr, rootData);
  if (!resolved.ok) {
    return {
      matched: false,
      resolutionFailed: true,
      reason: resolved.reason,
    };
  }
  try {
    const matched = jp.query(rootData, resolved.path).length > 0;
    return { matched, resolutionFailed: false };
  } catch {
    return { matched: false, resolutionFailed: false };
  }
};

/** Check if JSON response matches template conditions (JSONPath). */
export const validateResponseCondition = (
  jsonPathArr,
  matchRequestUrlResult
) => {
  let negativeIndexResolutionFailed = false;

  const isMatch = jsonPathArr.every((jpItem) => {
    try {
      if (typeof jpItem === 'string' && isRequestBodyValidationPath(jpItem)) {
        return true;
      }
      if (jpItem?.op === 'MATCH_ONE') {
        const {
          field: fatherJsonPath,
          subconditions: [{ op, field: sonJsonpath }],
        } = jpItem;
        if (isRequestBodyValidationPath(sonJsonpath)) {
          return true;
        }
        const firstJsonPath = fatherJsonPath?.split('[*]+')?.[0];
        const lastJsonpath = sonJsonpath.split('+')[1];

        if (
          !['>', '>=', '=', '!=', '<', '<=', 'STREQ', 'STRNEQ', 'STRCASEEQ', 'STRCASENEQ'].includes(
            op
          )
        ) {
          return false;
        }

        const resolvedFather = resolveNegativeJsonPathIndices(
          firstJsonPath,
          matchRequestUrlResult
        );
        if (!resolvedFather.ok) {
          negativeIndexResolutionFailed = true;
          return false;
        }

        const jsonpathQueryStr = `${resolvedFather.path}[0]${lastJsonpath}`;
        const queryRes = queryJsonPathWithNegativeIndices(
          jsonpathQueryStr,
          matchRequestUrlResult
        );
        if (queryRes.resolutionFailed) {
          negativeIndexResolutionFailed = true;
        }
        return queryRes.matched;
      }

      const pathExpr =
        typeof jpItem === 'string'
          ? jpItem
          : jpItem?.field?.field ?? jpItem?.field;

      if (typeof pathExpr !== 'string') {
        return false;
      }
      if (isRequestBodyValidationPath(pathExpr)) {
        return true;
      }

      const queryRes = queryJsonPathWithNegativeIndices(
        pathExpr,
        matchRequestUrlResult
      );
      if (queryRes.resolutionFailed) {
        negativeIndexResolutionFailed = true;
      }
      return queryRes.matched;
    } catch {
      return false;
    }
  });

  return { isMatch, negativeIndexResolutionFailed };
};
export const validateXPathWithLibs = (html, xpath) => {
  try {
    const normalizedXpath = String(xpath || '')
      .trim()
      // Template configs may mark XPath as optional with a trailing "?".
      // xpath lib does not support this syntax, so strip it before evaluation.
      .replace(/\?+$/, '');
    if (!normalizedXpath) return [];

    // Match duplicate aria-label/data-item-id attributes, keep the first one, and remove subsequent duplicates
    // const cleanedHtml = html
    //   .replace(/(\s+aria-label="[^"]+")(?=.*\1)/g, '')
    //   .replace(/(\s+data-item-id="[^"]+")(?=.*\1)/g, '');
    // Automatically handle all duplicate attributes without the need for manual regular expressions
    const $ = cheerio.load(html, { decodeEntities: false });
    // xmldom parses as XML; raw JS inside <script> often contains "<" which breaks XML parsing.
    // Empty <script> bodies (keep elements/attrs) so XPath like //script[n] still matches; strip style/noscript.
    $('script').empty();
    $('style,noscript').remove();
    const cleanedHtml = $.html()
      .replace(/&nbsp;/gi, ' ')
      .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    const parserMessages = [];
    const doc = new DOMParser({
      errorHandler: {
        warning: () => {},
        error: () => {},
        fatalError: (msg) => {
          parserMessages.push(String(msg || 'fatal parse error'));
        },
      },
    }).parseFromString(cleanedHtml);
    if (parserMessages.length) {
      throw new Error(parserMessages[0]);
    }
    const nodes = select(normalizedXpath, doc);

    return nodes
      .map((node) => {
        if (node.nodeType === 2) {
          // ATTRIBUTE_NODE
          return node.value;
        } else if (node.nodeType === 1) {
          // ELEMENT_NODE
          return node.getAttribute('content') || node.textContent;
        }
        return null;
      })
      .filter(Boolean);
  } catch (error) {
    console.error('Failed to valid XPath：', error.message);
    console.debug(
      'Error context：',
      html.substring(Math.max(0, error.position - 50), error.position + 50)
    );
    return [];
  }
};
/** Check if HTML response matches template conditions (XPath). */
export const validateHtmlResponseCondition = (jsonPathArr, html) => {
  const isMatch = jsonPathArr.every((jpItem) => {
    try {
      const itemMatch = validateXPathWithLibs(html, jpItem);
      return itemMatch && itemMatch.length > 0;
    } catch {
      return false;
    }
  });
  return isMatch;
};
// Replace existing parameters in the URL and add new parameters



