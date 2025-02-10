export const injectFont = () => {
  const linkElement = document.createElement('link');
  linkElement.href =
    'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">';
  linkElement.rel = 'stylesheet';
  const headElement = document.head;
  if (headElement) {
    headElement.appendChild(linkElement);
  }
};

export function createDomElement(html) {
  var dom = new DOMParser().parseFromString(html, 'text/html');
  return dom.body.firstElementChild;
}

export const request = async (fetchParams, baseUrl, padoExtensionVersion) => {
  let { method, url, data = {}, config } = fetchParams;
  method = method.toUpperCase();
  url = url.startsWith('http') || url.startsWith('https') ? url : baseUrl + url;

  if (method === 'GET') {
    let dataStr = '';
    Object.keys(data).forEach((key) => {
      dataStr += key + '=' + data[key] + '&';
    });
    if (dataStr !== '') {
      dataStr = dataStr.substr(0, dataStr.lastIndexOf('&'));
      url = url + '?' + dataStr;
    }
  }
  let golbalHeader = {
    'client-type': 'WEB',
    'client-version': padoExtensionVersion,
  };
  const { userInfo } = await chrome.storage.local.get(['userInfo']);
  if (userInfo) {
    const userInfoObj = JSON.parse(userInfo);
    const { id, token } = userInfoObj;
    if (
      !url.startsWith('https://storage.googleapis.com/primus-online') &&
      token
    ) {
      golbalHeader.Authorization = `Bearer ${token}`;
    }
    if (url.includes('/public/event/report')) {
      golbalHeader['user-id'] = id;
    }
  }
  const controller = new AbortController();
  const signal = controller.signal;
  const timeout = config?.timeout ?? 60000;
  const timeoutTimer = setTimeout(() => {
    controller.abort();
  }, timeout);
  let requestConfig = {
    credentials: 'same-origin',
    method: method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...golbalHeader,

      ...config?.extraHeader,
    },
    mode: 'cors', //  same-origin | no-cors（default）|cores;
    cache: config?.cache ?? 'default', //  default | no-store | reload | no-cache | force-cache | only-if-cached 。
    signal: signal,
  };

  if (method === 'POST') {
    Object.defineProperty(requestConfig, 'body', {
      value: JSON.stringify(data),
    });
  }
  try {
    const response = await fetch(url, requestConfig);
    const responseJson = await response.json();
    clearTimeout(timeoutTimer);
    if (responseJson.rc === 1 && responseJson.mc === '-999999') {
      store.dispatch({
        type: 'setRequireUpgrade',
        payload: true,
      });
    }
    return responseJson;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`fetch ${url} timeout`);
    } else {
      throw new Error(error);
    }
  } finally {
    clearTimeout(timeoutTimer);
  }
};

export const eventReport = async (data, baseUrl, padoExtensionVersion) => {
  let storedata = {};
  storedata.eventType = data.eventType;
  const { keyStore } = await chrome.storage.local.get(['keyStore']);
  if (keyStore) {
    const { address } = JSON.parse(keyStore);
    storedata.walletAddressOnChainId = '0x' + address;
  }
  if (data.rawData) {
    storedata.rawData = JSON.stringify(data.rawData);
  }

  return request(
    {
      method: 'post',
      url: `/public/event/report`,
      data: storedata,
    },
    baseUrl,
    padoExtensionVersion
  );
};

export const getContentWithValue = ({
  attestationType,
  verificationContent,
  verificationValue,
}) => {
  let vC = verificationContent,
    vV = verificationValue;
  if (attestationType === 'Assets Verification') {
    if (verificationContent === 'Assets Proof') {
      vC = 'Asset Balance';
      vV = `> $${verificationValue}`;
    } else if (verificationContent === 'Token Holding') {
      vC = 'Token Holding';
    } else if (verificationContent === 'Spot 30-Day Trade Vol') {
      vC = 'Spot 30-day Trade Vol';
      vV = `> $${verificationValue}`;
    }
  } else if (attestationType === 'Social Connections') {
    if (verificationContent === 'X Followers') {
      vC = 'Followers Number';
      vV = `> ${verificationValue}`;
    }
  } else if (verificationContent === 'Account ownership') {
    vC = 'Account Ownership';
  }
  return { verificationContent: vC, verificationValue: vV };
};
