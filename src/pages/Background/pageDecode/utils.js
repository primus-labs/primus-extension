import jp from 'jsonpath';
import dayjs from 'dayjs';
const { select } = require('xpath');
const { DOMParser } = require('xmldom');
const cheerio = require('cheerio');

import { customFetch2 } from '../utils/request';
export const extraRequestFn2 = async (params) => {
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

export const extraRequestHtmlFn = async (params) => {
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
      resolve(html);

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

export const errorFn = async (errorData, dataSourcePageTabId) => {
  let resParams = {
    result: false,
    errorData,
  };
  const { padoZKAttestationJSSDKDappTabId: dappTabId } =
    await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
  chrome.tabs.sendMessage(dappTabId, {
    type: 'padoZKAttestationJSSDK',
    name: 'getAttestationRes',
    params: resParams,
  });
  await chrome.storage.local.remove([
    'padoZKAttestationJSSDKBeginAttest',
    'padoZKAttestationJSSDKWalletAddress',
    'padoZKAttestationJSSDKAttestationPresetParams',
    'padoZKAttestationJSSDKXFollowerCount',
    'activeRequestAttestation',
  ]);
  if (dataSourcePageTabId) {
    await chrome.tabs.remove(dataSourcePageTabId);
  }
};

export const checkResIsMatchConditionFn = (
  jsonPathArr,
  matchRequestUrlResult
) => {
  const isMatch = jsonPathArr.every((jpItem) => {
    try {
      let hasField = false;
      if (jpItem?.op === 'MATCH_ONE') {
        const {
          field: fatherJsonPath,
          subconditions: [{ type, op, field: sonJsonpath, value }],
        } = jpItem;
        const firstJsonPath = fatherJsonPath?.split('[*]+')?.[0];
        const lastJsonpath = sonJsonpath.split('+')[1];
        let jsonpathQueryStr = '';

        if (['>', '>=', '=', '!=', '<', '<=', 'STREQ', 'STRNEQ'].includes(op)) {
          // let formatOp = op;
          // if (['=', 'STREQ'].includes(op)) {
          //   formatOp = '==';
          // }
          // if (['STRNEQ'].includes(op)) {
          //   formatOp = '!=';
          // }
          // const formatValue = ['STREQ', 'STRNEQ'].includes(op)
          //   ? `"${value}"`
          //   : value; // TODO
          // jsonpathQueryStr = `${firstJsonPath}[?(@${lastJsonpath} ${formatOp} ${formatValue})]`;

          jsonpathQueryStr = `${firstJsonPath}[0]${lastJsonpath}`;
          hasField =
            jp.query(matchRequestUrlResult, jsonpathQueryStr).length > 0;
        }
      } else {
        hasField = jp.query(matchRequestUrlResult, jpItem).length > 0;
      }
      return hasField;
    } catch {
      return false;
    }
  });
  return isMatch;
};
export const validateXPathWithLibs = (html, xpath) => {
  try {
    // Match duplicate aria-label/data-item-id attributes, keep the first one, and remove subsequent duplicates
    // const cleanedHtml = html
    //   .replace(/(\s+aria-label="[^"]+")(?=.*\1)/g, '')
    //   .replace(/(\s+data-item-id="[^"]+")(?=.*\1)/g, '');
    // Automatically handle all duplicate attributes without the need for manual regular expressions
    const $ = cheerio.load(html);
    const cleanedHtml = $.html();
    const doc = new DOMParser().parseFromString(cleanedHtml);
    const nodes = select(xpath, doc);

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
export const checkResHtmlIsMatchConditionFn = (jsonPathArr, html) => {
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
export const getNMonthsBeforeTime = (timestamp, n) => {
  const nowTime = dayjs(timestamp);
  let targetTime2 = nowTime.subtract(n, 'month');
  targetTime2 = targetTime2.subtract(1, 'day').add(1, 'second').valueOf();
  return targetTime2;
};
export const getUTCDayLastSecondTime = (timestamp) => {
  const nowTime = dayjs(timestamp);
  const targetTime = nowTime.endOf('day').valueOf();
  return targetTime;
};
// Replace existing parameters in the URL and add new parameters
export function updateUrlParams(url, paramsObj) {
  const urlObj = new URL(url);
  const searchParams = urlObj.searchParams;

  Object.entries(paramsObj).forEach(([key, value]) => {
    if (searchParams.has(key)) {
      searchParams.set(key, value);
    } else {
      searchParams.append(key, value);
    }
  });

  urlObj.search = searchParams.toString();
  return urlObj.toString();
}

export function parseUrlQuery(url) {
  const urlObj = new URL(url);

  const searchParams = urlObj.searchParams;

  const queryObj = {};

  searchParams.forEach((value, key) => {
    if (!isNaN(value) && value !== '') {
      queryObj[key] = Number(value);
    } else {
      queryObj[key] = value;
    }
  });

  return queryObj;
}
