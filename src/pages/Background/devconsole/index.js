import { customFetch2 } from '../utils/request';
let checkDataSourcePageTabId;
let devconsoleTabId;

const extraRequestFn = async (params) => {
  try {
    const requestRes = await customFetch2(params);
    // debugger;
    chrome.tabs.sendMessage(devconsoleTabId, {
      type: 'devconsole',
      name: 'checkDataSourceRes',
      params: {
        request: params,
        response: requestRes,
      },
    });
  } catch (e) {
    console.log('fetch custom request error', e);
  }
};

export const devconsoleMsgListener = async (
  request,
  sender,
  sendResponse,
  password,
  port
) => {
  const { name, params } = request;

  const storeDataSourceRequestsFn = async (url, urlInfo) => {
    const { dataSourceRequests: dataSourceRequestsStr } =
      await chrome.storage.local.get(['dataSourceRequests']);
    let dataSourceRequestsObj = dataSourceRequestsStr
      ? JSON.parse(dataSourceRequestsStr)
      : {};
    Object.assign(dataSourceRequestsObj, {
      [url]: urlInfo,
    });
    await chrome.storage.local.set({
      dataSourceRequests: JSON.stringify(dataSourceRequestsObj),
    });
    return dataSourceRequestsObj[url];
  };

  const onBeforeSendHeadersFn = async (details) => {
    const {
      url: currRequestUrl,
      requestHeaders,
      method,
      type,
      tabId,
    } = details;
    if (
      tabId === checkDataSourcePageTabId &&
      ['xmlhttprequest', 'fetch'].includes(type) &&
      method !== 'OPTIONS'
    ) {
      console.log('444-onBeforeSendHeadersFn-details', details);
      let formatUrlKey = currRequestUrl;
      let formatHeader = requestHeaders.reduce((prev, curr) => {
        const { name, value } = curr;
        prev[name] = value;
        return prev;
      }, {});
      await storeDataSourceRequestsFn(formatUrlKey, { method });
      const dataSourceRequestsObj = await storeDataSourceRequestsFn(
        formatUrlKey,
        { header: formatHeader }
      );

      console.log('444-listen', formatUrlKey);
      extraRequestFn({ ...dataSourceRequestsObj, url: currRequestUrl });
    }
  };
  const onBeforeRequestFn = async (subDetails) => {
    const {
      url: currRequestUrl,
      requestBody,
      type,
      tabId,
      method,
    } = subDetails;
    if (
      tabId === checkDataSourcePageTabId &&
      ['xmlhttprequest', 'fetch'].includes(type) &&
      method !== 'OPTIONS'
    ) {
      console.log('444-onBeforeRequestFn-subDetails', subDetails);
      let formatUrlKey = currRequestUrl;
      if (requestBody && requestBody.raw) {
        const rawBody = requestBody.raw[0];
        if (rawBody && rawBody.bytes) {
          const byteArray = new Uint8Array(rawBody.bytes);
          const bodyText = new TextDecoder().decode(byteArray);
          // console.log(
          //   `444-url:${subDetails.url}, method:${subDetails.method} Request Body: ${bodyText}`
          // );
          await storeDataSourceRequestsFn(formatUrlKey, { body: bodyText });
        }
      }
    }
  };

  if (name === 'init') {
    devconsoleTabId = sender.tab.id;
    chrome.webRequest.onBeforeSendHeaders.addListener(
      onBeforeSendHeadersFn,
      { urls: ['<all_urls>'] },
      ['requestHeaders', 'extraHeaders']
    );
    chrome.webRequest.onBeforeRequest.addListener(
      onBeforeRequestFn,
      { urls: ['<all_urls>'] },
      ['requestBody']
    );

    const tabCreatedByPado = await chrome.tabs.create({
      url: params.expectedUrl,
    });
    checkDataSourcePageTabId = tabCreatedByPado.id;
    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      if (tabId === checkDataSourcePageTabId) {
        console.log('devconsole-user close data source page');
        chrome.runtime.sendMessage({
          type: 'devconsole',
          name: 'close',
        });
        chrome.webRequest.onBeforeSendHeaders.removeListener(
          onBeforeSendHeadersFn,
          { urls: ['<all_urls>'] },
          ['requestHeaders', 'extraHeaders']
        );
        chrome.webRequest.onBeforeRequest.removeListener(
          onBeforeRequestFn,
          { urls: ['<all_urls>'] },
          ['requestBody']
        );
      }
    });
  } else if (name === 'testTemplate') {
    const formatAlgorithmParamsFn = async () => {
      let {
        dataSource,
        schemaType,
        datasourceTemplate: { host, requests, responses, calculations },
        uiTemplate,
        id,
        event,
        category,
        requestid,
        algorithmType,
      } = activeTemplate;
      const form = {
        source: dataSource,
        type: category,
        label: null,
        exUserId: null,
        requestid,
        algorithmType: algorithmType || 'mpctls',
      };
      if (event) {
        form.event = event;
      }
      // "X Followers" required update baseValue
      // console.log('activeTemplate', activeTemplate, dataSource);
      if (activeTemplate.id === '15') {
        form.baseValue =
          activeTemplate.datasourceTemplate.responses[1].conditions.subconditions[1].value;
      }
      if (activeTemplate.requestid) {
        form.requestid = activeTemplate.requestid;
      }
      let aligorithmParams = await assembleAlgorithmParams(form, password);
      const formatRequests = [];
      for (const r of JSON.parse(JSON.stringify(requests))) {
        if (r.queryDetail) {
          continue;
        }
        let { headers, cookies, body, url, urlType } = r;
        let formatUrlKey = url;
        if (urlType === 'REGX') {
          formatUrlKey = await chrome.storage.local.get(url);
          formatUrlKey = formatUrlKey[url];
          url = formatUrlKey;
          r.url = url;
        }
        const requestInfoObj = await chrome.storage.local.get([formatUrlKey]);
        const currRequestInfoObj =
          (requestInfoObj[url] && JSON.parse(requestInfoObj[url])) || {};
        const {
          headers: curRequestHeader,
          body: curRequestBody,
          queryString,
        } = currRequestInfoObj;
        console.log('lastStorage-get', url, currRequestInfoObj);
        const cookiesObj = curRequestHeader
          ? parseCookie(curRequestHeader.Cookie)
          : {};
        let formateHeader = {},
          formateCookie = {},
          formateBody = {};
        if (headers && headers.length > 0) {
          headers.forEach((hk) => {
            if (curRequestHeader) {
              const inDataSourceHeaderKey = Object.keys(curRequestHeader).find(
                (h) => h.toLowerCase() === hk.toLowerCase()
              );
              formateHeader[hk] = curRequestHeader[inDataSourceHeaderKey];
            }
          });
          Object.assign(r, {
            headers: formateHeader,
          });
        }
        if (cookies && cookies.length > 0) {
          cookies.forEach((ck) => {
            formateCookie[ck] = cookiesObj[ck];
          });
          Object.assign(r, {
            cookies: formateCookie,
          });
        }
        if (body && body.length > 0) {
          body.forEach((hk) => {
            formateBody[hk] = curRequestBody[hk];
          });
          Object.assign(r, {
            body: formateBody,
          });
        }
        if (queryString) {
          Object.assign(r, {
            url: r.url + '?' + queryString,
          });
        }
        if ('queryParams' in r) {
          delete r.queryParams;
        }

        formatRequests.push(r);
      }
      const activeInfo = formatRequests.find((i) => i.headers);
      const activeHeader = Object.assign({}, activeInfo.headers);
      const authInfoName = dataSource + '-auth';
      await chrome.storage.local.set({
        [authInfoName]: JSON.stringify(activeHeader),
      });
      let formatResponse = JSON.parse(JSON.stringify(responses));
      if (dataSource === 'binance') {
        for (const fr of formatRequests) {
          if (fr.headers) {
            fr.headers['Accept-Encoding'] = 'identity';
          }
        }
      } else if (dataSource === 'chatgpt') {
        const { chatGPTExpression } = activeTemplate;
        if (chatGPTExpression) {
          aligorithmParams.chatGPTExpression = chatGPTExpression;
        }
        const extraRequestSK = `https://chatgpt.com/backend-api/conversation-extra`;
        const extraSObj = await chrome.storage.local.get([extraRequestSK]);
        const extraRequestInfo = extraSObj[extraRequestSK]
          ? JSON.parse(extraSObj[extraRequestSK])
          : {};
        const {
          request: {
            url,
            method,
            headers: { host },
          },
          response: { messageIds },
        } = extraRequestInfo;

        formatRequests[1].url = url;
        formatRequests[1].method = method;
        formatRequests[1].headers.host = host;
        let originSubConditionItem =
          formatResponse[1].conditions.subconditions[0];
        formatResponse[1].conditions.subconditions = [];
        messageIds.forEach((mK) => {
          const fieldArr = originSubConditionItem.field.split('.');
          fieldArr[2] = mK;
          formatResponse[1].conditions.subconditions.push({
            ...originSubConditionItem,
            reveal_id: mK,
            field: fieldArr.join('.'),
          });
        });
      }
      Object.assign(aligorithmParams, {
        reqType: 'web',
        host: host,
        schemaType,
        requests: formatRequests,
        responses: formatResponse,
        uiTemplate,
        templateId: id,
        calculations,
        PADOSERVERURL,
        padoExtensionVersion,
      });
      if (schemaType.startsWith('OKX_TOKEN_HOLDING')) {
        aligorithmParams.requests[2].url =
          aligorithmParams.requests[2].url.replace('limit=5', 'limit=100');
      }

      formatAlgorithmParams = aligorithmParams;
      console.log(
        'formatAlgorithmParams',
        formatAlgorithmParams,
        form,
        activeTemplate
      );
    };
  }
};
