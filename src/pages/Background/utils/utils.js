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
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

export function matchReg(regStr, str) {
  var regex = new RegExp(regStr, 'g');
  const isTarget = str.match(regex);
  const result = isTarget && isTarget.length > 0;
  return result;
}

// just for pageDecode.js
export const parseCookie = (str) => {
  str = str || '';
  return str
    .split(';')
    .map((v) => v.split('='))
    .reduce((acc, v) => {
      if (v[0] && v[1]) {
        acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      }

      return acc;
    }, {});
};
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

export const getErrorMsgFn = async (attestationType, errorCode) => {
  let errorMsgTitle = ['Assets Verification', 'Humanity Verification'].includes(
    attestationType
  )
    ? `${attestationType} failed!`
    : `${attestationType} proof failed!`;
  const { configMap } = await chrome.storage.local.get(['configMap']);
  let attestTipMap = {};
  if (
    configMap &&
    JSON.parse(configMap) &&
    JSON.parse(configMap).ATTESTATION_PROCESS_NOTE
  ) {
    attestTipMap = JSON.parse(JSON.parse(configMap).ATTESTATION_PROCESS_NOTE);
  }
  let msgObj = {
    title: errorMsgTitle,
    type: attestTipMap[errorCode].type,
    desc: attestTipMap[errorCode].desc,
    sourcePageTip: attestTipMap[errorCode].title,
  };
  const msg = {
    name: 'end',
    params: {
      result: 'warn',
      failReason: { ...msgObj },
    },
  };
  return msg;
};

export const sendMsgToTab = async (tabId, msg) => {
  await chrome.tabs.sendMessage(tabId, msg);
};
