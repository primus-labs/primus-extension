export function isJSONString(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
export function encodeFormData(data) {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
}

export function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
  // return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

export function matchReg(regStr, str) {
  var regex = new RegExp(regStr, 'g');
  const isTarget = str.match(regex);
  const result = isTarget && isTarget.length > 0;
  return result;
}

// just for pageDecode.js
export const isUrlWithQueryFn = (url, queryKeyArr) => {
  const urlStrArr = url.split('?');
  const queryStr = urlStrArr[1];
  const queryStrArr = queryStr.split('&');
  const isUrlWithQuery = queryKeyArr.every((tQItem) => {
    return queryStrArr.some((qItem) => {
      return qItem.split('=')[0] === tQItem;
    });
  });
  return isUrlWithQuery ? queryStr : false;
};

export function checkIsRequiredUrl({
  requestUrl,
  requiredUrl,
  urlType,
  queryParams,
}) {
  const specifiedQueryParams = queryParams?.[0] ? queryParams : null;
  // console.log('requestUrl', requestUrl);
  const hostUrl = requestUrl.split('?')[0];
  const type =
    urlType === 'REGX' && requestUrl !== requiredUrl
      ? 'REGX'
      : requiredUrl === hostUrl && specifiedQueryParams
      ? 'withSpecifiedQueryParams'
      : '';

  if (type === 'REGX') {
    return matchReg(requiredUrl, requestUrl);
  } else if (type === 'withSpecifiedQueryParams') {
    let curUrlWithQuery = isUrlWithQueryFn(requestUrl, specifiedQueryParams);
    return !!curUrlWithQuery;
  } else {
    return requestUrl === requiredUrl;
  }
}

/**
 * Merge queryParams (object) into URL: existing params are replaced, new keys are appended.
 * Uses ? for first query string and correct concatenation.
 */
export function mergeQueryParamsIntoUrl(url, queryParams) {
  if (
    !url ||
    typeof queryParams !== 'object' ||
    queryParams === null ||
    Array.isArray(queryParams)
  ) {
    return url;
  }
  const [base, search] = url.split('?');
  const params = new URLSearchParams(search || '');
  for (const [k, v] of Object.entries(queryParams)) {
    if (v !== undefined && v !== null) {
      params.set(k, String(v));
    }
  }
  const newSearch = params.toString();
  return newSearch ? `${base}?${newSearch}` : base;
}

/**
 * Merge bodyParams (object) into body: existing keys are replaced, new keys are added.
 */
export function mergeBodyParams(body, bodyParams) {
  if (
    typeof bodyParams !== 'object' ||
    bodyParams === null ||
    Array.isArray(bodyParams)
  ) {
    return body;
  }
  if (isObject(body)) {
    return { ...body, ...bodyParams };
  }
  return { ...bodyParams };
}

export const sendMsgToTab = async (tabId, msg) => {
  await chrome.tabs.sendMessage(tabId, msg);
};