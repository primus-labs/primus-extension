import { getAlgoUrl } from '@/services/api/algorithm';
type ENVTYPE = 'development' | 'test' | 'production';

export const CURENV = process.env.NODE_ENV as ENVTYPE;
console.log('222CURENV', CURENV, process.env);
const PADOURLMAP = {
  development: 'wss://api-dev.padolabs.org/algorithm',
  test: '18.179.8.186:8888',
  production: 'wss://api.padolabs.org/algorithm',
};
export let PADOURL = PADOURLMAP[CURENV];

const ZKPADOURLMAP = {
  development: 'wss://api-dev.padolabs.org/algorithm-proxy',
  production: 'wss://api.padolabs.org/algorithm-proxy',
};
export let ZKPADOURL = ZKPADOURLMAP[CURENV];

const PROXYURLMAP = {
  development: 'wss://api-dev.padolabs.org/algoproxy',
  test: '18.179.8.186:9000',
  production: 'wss://api.padolabs.org/algoproxy',
};
export let PROXYURL = PROXYURLMAP[CURENV];

const PADOSERVERURLMAP = {
  development: 'https://api-dev.padolabs.org',
  test: 'http://18.179.8.186:8080',
  production: 'https://api.padolabs.org',
};
export const PADOSERVERURL = PADOSERVERURLMAP[CURENV];
export const updateAlgoUrl = async () => {
  const { algorithmUrl } = await chrome.storage.local.get(['algorithmUrl']);
  if (!algorithmUrl) {
    console.log('updateAlgoUrl store first');
    const algojsonobj = {
      padoUrl: PADOURL,
      zkPadoUrl: ZKPADOURL,
      proxyUrl: PROXYURL,
    };
    await chrome.storage.local.set({
      algorithmUrl: JSON.stringify(algojsonobj),
    });
  }

  const res = await getAlgoUrl();

  console.log('updateAlgoUrl res=', res);
  if (res?.rc === 0) {
    let isInited = false;
    res.result.forEach((item: any) => {
      let ws = new WebSocket(`wss://${item.algoProxyDomain}/algoproxy`);
      ws.onopen = async function (_e) {
        console.log('updateAlgoUrl onopen url=', item.algoProxyDomain);
        if (!isInited) {
          console.log('updateAlgoUrl onopen update url new');
          PADOURL = `wss://${item.algorithmDomain}/algorithm`;
          ZKPADOURL = `wss://${item.algorithmDomain}/algorithm-proxy`;
          PROXYURL = `wss://${item.algoProxyDomain}/algoproxy`;
          const jsonobj = {
            padoUrl: PADOURL,
            zkPadoUrl: ZKPADOURL,
            proxyUrl: PROXYURL,
          };
          if (jsonobj) {
            await chrome.storage.local.set({
              algorithmUrl: JSON.stringify(jsonobj),
            });
            isInited = true;
          }
        }
        ws.close();
      };
      ws.onerror = function (e) {
        console.log('updateAlgoUrl ws onerror', e);
      };
      ws.onclose = function (e) {
        console.log('updateAlgoUrl ws onclose', e);
      };
    });
  }
};

export const getPadoUrl = async () => {
  const { algorithmUrl } = await chrome.storage.local.get(['algorithmUrl']);
  if (algorithmUrl) {
    const algorithmUrlObj = JSON.parse(algorithmUrl);
    console.log('updateAlgoUrl getPadoUrl PADOURL=', algorithmUrlObj.padoUrl);
    return algorithmUrlObj.padoUrl;
  } else {
    return '';
  }
};

export const getZkPadoUrl = async () => {
  const { algorithmUrl } = await chrome.storage.local.get(['algorithmUrl']);
  if (algorithmUrl) {
    const algorithmUrlObj = JSON.parse(algorithmUrl);
    console.log('updateAlgoUrl getZkPadoUrl ZKPADOURL=', algorithmUrlObj.zkPadoUrl);
    return algorithmUrlObj.zkPadoUrl;
  } else {
    return '';
  }
};

export const getProxyUrl = async () => {
  const { algorithmUrl } = await chrome.storage.local.get(['algorithmUrl']);

  if (algorithmUrl) {
    const algorithmUrlObj = JSON.parse(algorithmUrl);
    console.log(
      'updateAlgoUrl getProxyUrl PROXYURL=',
      algorithmUrlObj.proxyUrl
    );
    return algorithmUrlObj.proxyUrl;
  } else {
    return '';
  }
};
