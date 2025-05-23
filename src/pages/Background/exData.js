import { encrypt, decrypt } from '@/utils/crypto';
import { DATASOURCEMAP } from '@/config/dataSource';
import { SCROLLEVENTNAME, BASEVENTNAME } from '@/config/events';
import { schemaTypeMap } from '@/config/constants';
import { CredVersion } from '@/config/attestation';
import { getPadoUrl, getProxyUrl, getZkPadoUrl } from '@/config/envConstants';
import { getCurrentDate, sub, postMsg, strToHex } from '@/utils/utils';
import { storeDataSource } from './dataSourceUtils';

export let EXCHANGEINFO = {
  binance: {
    name: 'binance',
    apiKey: '',
    secretKey: '',
  },
  okx: {
    name: 'okx',
    apiKey: '',
    secretKey: '',
    passphase: '',
  },
  kucoin: {
    name: 'kucoin',
    apiKey: '',
    secretKey: '',
    passphase: '',
  },
  coinbase: {
    name: 'coinbase',
    apiKey: '',
    secretKey: '',
  },
};
export function clear() {
  EXCHANGEINFO = {};
}

export async function sign(exchangeName, data, USERPASSWORD, port) {
  const message = {
    type: `sign-${exchangeName}`,
    params: {},
  };
  const exchange = await getExchange(message, USERPASSWORD, port);
  const res = exchange.ex.exchange.sign(
    data.path,
    data.api,
    data.method,
    data.params,
    data.headers,
    data.body
  );
  EXCHANGEINFO[exchangeName] = exchange.exParams;
  return res;
}

const getExchange = async (message, USERPASSWORD, port) => {
  var {
    type,
    params: { apiKey },
  } = message;
  const exchangeName = type.split('-')[1];
  // console.log('getExchange exData type:', type);
  // get ex constructor params
  // request ex data
  const exchangeInfo = DATASOURCEMAP[exchangeName];
  const constructorF = exchangeInfo.constructorF;
  let exParams = {};
  let ex;
  if (exchangeInfo.connectType === 'API') {
    if (apiKey) {
      exParams = message.params;
    } else if (EXCHANGEINFO[exchangeName]?.apiKey) {
      exParams = EXCHANGEINFO[exchangeName];
    } else {
      const cipherData = await chrome.storage.local.get(
        exchangeName + 'cipher'
      );
      if (!USERPASSWORD) {
        if (port) {
          postMsg(port, {
            resType: 'lock',
          });
        }
      }
      if (cipherData) {
        try {
          const apiKeyInfo = JSON.parse(
            decrypt(cipherData[exchangeName + 'cipher'], USERPASSWORD)
          );
          exParams = { ...apiKeyInfo };
        } catch (err) {
          console.log('decrypt', err);
        }
      }
    }

    ex = new constructorF(exParams);
  } else if (exchangeInfo.connectType === 'Web') {
    ex = new constructorF();
  }
  return { ex: ex, exParams: exParams };
};

const processNetworkReq = async (message, port, USERPASSWORD) => {
  var {
    type,
    params: { apiKey, secretKey, passphase, name, exData, label, withoutMsg },
  } = message;
  const exchangeName = type.split('-')[1];
  if (type.startsWith('set-')) {
    console.log('exData type:', type);
    try {
      const exchange = await getExchange(message, USERPASSWORD, port);
      const ex = exchange.ex;
      const exParams = exchange.exParams;
      await storeDataSource(exchangeName, ex, port, {
        apiKey: exParams?.apiKey,
        withoutMsg: withoutMsg,
      });
      if (apiKey) {
        const { apiKey, secretKey, passphase } = exParams;
        const exCipherData = {
          apiKey,
          secretKey,
          passphase,
          label,
        };
        const encryptedKey = encrypt(
          JSON.stringify(exCipherData),
          USERPASSWORD
        );
        // get storage from store first,then store new info of new apikey
        await chrome.storage.local.set({
          [exchangeName + 'cipher']: JSON.stringify(encryptedKey),
        });
        EXCHANGEINFO[exchangeName] = exParams;
      } else {
        EXCHANGEINFO[exchangeName] = exParams;
      }
    } catch (error) {
      console.log(
        'exData-',
        error,
        error.message,
        error.message.indexOf('AuthenticationError')
      );
    }
  }
};
export default processNetworkReq;

// port is unnecesary when you assemble algorithm params for page decode
export async function assembleAlgorithmParams(form, USERPASSWORD, port) {
  const {
    source,
    type,
    baseValue,
    token: holdingToken,
    label,
    exUserId,
    requestid: prevRequestid,
    event,
    algorithmType = 'proxytls',
    cipher,
  } = form;
  // const { baseName } = DATASOURCEMAP[source];
  const baseName = DATASOURCEMAP[source] && DATASOURCEMAP[source].baseName; // unnecessary for web proof
  const user = await assembleUserInfoParams(form);

  const { userInfo } = await chrome.storage.local.get(['userInfo']);
  const { id: authUserId } = JSON.parse(userInfo);
  const authUseridHash = strToHex(authUserId);

  const timeStampStr = (+new Date()).toString();
  let schemaType = schemaTypeMap[type];
  const padoUrl = await getPadoUrl();
  const proxyUrl = await getProxyUrl();
  const zkPadoUrl = await getZkPadoUrl();
  const params = {
    type,
    label,
    exUserId,
    source,
    requestid: prevRequestid || timeStampStr,
    //version: CredVersion,
    baseName, // host, such as "api.binance.com"
    padoUrl: algorithmType === 'proxytls' ? zkPadoUrl : padoUrl, // client <----> pado-server
    modelType: algorithmType,
    proxyUrl: proxyUrl,
    errLogUrl: 'wss://api.padolabs.org/logs',
    // if cipher non-exist or empty use default. options:
    //    ECDHE-RSA-AES128-GCM-SHA256(default), ECDHE-ECDSA-AES128-GCM-SHA256
    cipher: cipher || '',
    getdatatime: timeStampStr,
    credVersion: CredVersion,

    sigFormat: 'EAS-Ethereum',
    schemaType,
    user,
    // holdingToken
    authUseridHash,
    event,
    setHostName: 'true',
    hasFirstReq: 'true', // default  false
  };
  let calculationType;
  const sourceUpperCaseName = source.toUpperCase();
  if (type === 'ASSETS_PROOF') {
    params.baseValue = baseValue;
    calculationType = `SUM_OF_ALL`;
    if (source === 'binance') {
      calculationType = 'KEY_VALUES_SUM_X_A';
    } else if (source === 'coinbase') {
      calculationType = 'SUM_OF__KEY_VALUES_SUM_X_A';
    }
  } else if (type === 'TOKEN_HOLDINGS') {
    params.baseValue = '0';
    params.holdingToken = holdingToken;
    calculationType = `SUM_OF__A_KEY_VALUES`;
  }
  if (baseValue) {
    params.baseValue = baseValue;
  }
  if (port) {
    // it's noneed for page decode
    const extRequestsOrderInfo = await assembleAccountBalanceRequestParams(
      form,
      USERPASSWORD,
      port
    );
    if (source === 'coinbase') {
      extRequestsOrderInfo.name = 'token-holding';
      const request0 = {
        name: 'first',
        url: 'https://api.coinbase.com/v2/time',
      };
      const response1 = {
        conditions: {
          type: 'CONDITION_EXPANSION',
          op: '&',
          subconditions: [
            {
              type: 'FIELD_RANGE',
              field: '$.data.balance.currency',
              op: 'STREQ',
              value: holdingToken,
            },
            {
              type: 'FIELD_RANGE',
              field: '$.data.balance.amount',
              op: '>',
              value: '0',
            },
          ],
        },
      };
      Object.assign(params, {
        reqType: 'web',
        host: baseName,
        requests: [request0, extRequestsOrderInfo],
        responses: [{}, response1],
      });
      return params;
    }

    let extRequestsOrder;
    if (source === 'binance') {
      extRequestsOrder = 'asset-balances';
    } else {
      extRequestsOrder = 'account-balance';
    }

    let ext;
    if (source === 'binance' || source === 'okx') {
      const extUidHashRequestsInfo = await assembleUidHashRequestsParams(
        form,
        USERPASSWORD,
        port
      );
      ext = {
        calculationType: calculationType, // NO_ACTION/A_PURE_NUMBER/OKX_ACCOUNT_BALANCE/OKX_ASSET_BALANCES
        extRequests: {
          orders: ['uid-hash', extRequestsOrder],
          'uid-hash': extUidHashRequestsInfo,
          [extRequestsOrder]: extRequestsOrderInfo,
        },
      };
    } else {
      ext = {
        calculationType: calculationType, // NO_ACTION/A_PURE_NUMBER/OKX_ACCOUNT_BALANCE/OKX_ASSET_BALANCES
        extRequests: {
          orders: [extRequestsOrder],
          [extRequestsOrder]: extRequestsOrderInfo,
        },
      };
    }
    ext.event = event;

    Object.assign(params, {
      ext,
    });
  } else {
    Object.assign(params, {
      ext: { event },
    });
  }

  return params;
}
export async function assembleAlgorithmParamsForSDK(form, ext) {
  const {
    dataSource,
    algorithmType = 'proxytls',
    requestid: prevRequestid,
    sslCipherSuite,
  } = form;
  // const urlObj = new URL(dataPageTemplate.baseUrl);
  // const baseName = urlObj.host;
  const user = await assembleUserInfoParams({}, true);
  const { userInfo } = await chrome.storage.local.get(['userInfo']);
  const { id: authUserId } = JSON.parse(userInfo);
  const authUseridHash = strToHex(authUserId);

  const timeStampStr = (+new Date()).toString();
  const padoUrl = await getPadoUrl();
  const proxyUrl = await getProxyUrl();
  const zkPadoUrl = await getZkPadoUrl();

  const appSignParameters = JSON.parse(ext.appSignParameters);
  const params = {
    source: dataSource,
    requestid: prevRequestid || timeStampStr,
    padoUrl: algorithmType === 'proxytls' ? zkPadoUrl : padoUrl, // client <----> pado-server
    modelType: algorithmType,
    proxyUrl: proxyUrl,
    errLogUrl: 'wss://api.padolabs.org/logs',
    cipher: sslCipherSuite || '',
    getdatatime: timeStampStr,
    credVersion: CredVersion,
    // sigFormat: 'EAS-Ethereum',
    // schemaType,
    user,
    authUseridHash,
    setHostName: 'true',
    appParameters: {
      appId: appSignParameters.appId,
      appSignParameters: ext.appSignParameters,
      appSignature: ext.appSignature,
      additionParams: appSignParameters.additionParams
        ? appSignParameters.additionParams
        : '',
    },
  };
  if (ext.padoUrl && ext.proxyUrl) {
    params.padoUrl = ext.padoUrl;
    params.proxyUrl = ext.proxyUrl;
  }

  return params;
}

async function assembleUidHashRequestsParams(form, USERPASSWORD, port) {
  const sourceLowerCaseName = form.source.toLowerCase();
  let extRequestsOrderInfo = {};
  let data = {};
  let signres = null;
  switch (sourceLowerCaseName) {
    case 'binance':
      data = {
        path: 'account',
        api: 'private',
        method: 'GET',
        params: { recvWindow: 60 * 1000 },
      };
      signres = await sign('binance', data, USERPASSWORD, port);
      signres.parseSchema = 'A_PURE_NUMBER:beg_tag="uid"::end_tag=}';
      signres.decryptFlag = 'false';
      signres.calculationType = 'A_VALUE_HASH';
      extRequestsOrderInfo = { ...signres };
      break;
    case 'okx':
      data = {
        path: 'account/config',
        api: 'private',
        method: 'GET',
        params: {},
      };
      signres = await sign('okx', data, USERPASSWORD, port);
      signres.parseSchema = 'A_PURE_NUMBER:beg_tag="mainUid":":end_tag="';
      signres.decryptFlag = 'false';
      signres.calculationType = 'A_VALUE_HASH';
      extRequestsOrderInfo = { ...signres };
      break;
    default:
      break;
  }
  return extRequestsOrderInfo;
}

async function assembleAccountBalanceRequestParams(form, USERPASSWORD, port) {
  const sourceLowerCaseName = form.source.toLowerCase();
  let extRequestsOrderInfo = {};
  let data = {};
  let signres = null;
  switch (sourceLowerCaseName) {
    case 'binance':
      data = {
        path: 'asset/getUserAsset',
        api: 'sapiV3',
        method: 'POST',
        params: { recvWindow: 60 * 1000 },
      };
      if (form.type === 'TOKEN_HOLDINGS') {
        data.params.asset = form.token;
      }
      signres = await sign('binance', data, USERPASSWORD, port);
      signres.parseSchema =
        'MAP_A_PURE_NUMBER_REGEX:KVVVV:"asset":"(.*?)"[\\s\\S]*?"free":"(.*?)"[\\s\\S]*?"locked":"(.*?)"[\\s\\S]*?"freeze":"(.*?)"[\\s\\S]*?"withdrawing":"(.*?)"';
      signres.decryptFlag = 'false';
      //signres.url = 'https://localhost/simulate/sapi/v3/asset/getUserAsset';
      extRequestsOrderInfo = { ...signres };
      break;
    case 'coinbase':
      data = {
        path: 'accounts',
        api: ['v2', 'private'],
        method: 'GET',
        params: { limit: 100 },
      };
      if (form.type === 'TOKEN_HOLDINGS') {
        data.path = 'accounts/{account_id}';
        data.params = { account_id: form.token };
      }
      signres = await sign('coinbase', data, USERPASSWORD, port);
      signres.headers['CB-VERSION'] = '2018-05-30';
      //signres.parseSchema =
      //  'MAP_A_PURE_NUMBER_REGEX:VK:"amount":"(.*?)"[\\s\\S]*?"currency":"(.*?)"';
      //signres.decryptFlag = 'false';
      extRequestsOrderInfo = { ...signres };
      break;
    case 'okx':
      data = {
        path: 'account/balance',
        api: 'private',
        method: 'GET',
        params: {},
      };
      if (form.type === 'TOKEN_HOLDINGS') {
        data.params.ccy = form.token;
      }
      signres = await sign('okx', data, USERPASSWORD, port);
      signres.parseSchema = 'A_PURE_NUMBER:beg_tag="totalEq":":end_tag="';
      if (form.type === 'TOKEN_HOLDINGS') {
        signres.parseSchema =
          'MAP_A_PURE_NUMBER_REGEX:KV:"ccy":"(.*?)"[\\s\\S]*?"eq":"(.*?)"';
      }
      signres.decryptFlag = 'false';

      extRequestsOrderInfo = { ...signres };
      // extRequestsOrderInfo = {
      //   url: accountBalanceUrl,
      //   method: 'GET',
      //   headers: {
      //     'OK-ACCESS-KEY': signHeader['OK-ACCESS-KEY'],
      //     'OK-ACCESS-PASSPHRASE': 'Padopado@2022',
      //     'OK-ACCESS-SIGN': signres.headers['OK-ACCESS-SIGN'],
      //     'OK-ACCESS-TIMESTAMP': signres.headers['OK-ACCESS-TIMESTAMP'],
      //   },
      //   body: {},
      // };
      break;
    case 'kucoin':
      data = {
        path: 'accounts',
        api: ['v2', 'private'],
        method: 'GET',
        params: {},
      };
      signres = await sign('kucoin', data, USERPASSWORD, port);
      extRequestsOrderInfo = { ...signres };
      break;
    default:
      break;
  }
  return extRequestsOrderInfo;
}
async function assembleUserInfoParams(form, isFromSDK) {
  const { event } = form;
  const {
    connectedWalletAddress,
    userInfo,
    padoZKAttestationJSSDKWalletAddress,
  } = await chrome.storage.local.get([
    'connectedWalletAddress',
    'userInfo',
    'padoZKAttestationJSSDKWalletAddress',
  ]);
  let formatAddress;
  if (connectedWalletAddress) {
    formatAddress = JSON.parse(connectedWalletAddress).address;
  }
  console.log(
    'debuge-zktls-startAttestation3',
    padoZKAttestationJSSDKWalletAddress
  );
  if (event === SCROLLEVENTNAME) {
    const { scrollEvent } = await chrome.storage.local.get(['scrollEvent']);
    const scrollEventObj = scrollEvent ? JSON.parse(scrollEvent) : {};
    if (scrollEventObj.address) {
      formatAddress = scrollEventObj.address;
    }
    console.log('algorithmParams-userAddress-scroll', formatAddress);
  } else if (event === BASEVENTNAME) {
    const res = await chrome.storage.local.get([BASEVENTNAME]);
    if (res[BASEVENTNAME]) {
      const lastInfo = JSON.parse(res[BASEVENTNAME]);
      const lastCredAddress = lastInfo.address;
      if (lastCredAddress) {
        formatAddress = lastCredAddress;
      }
      console.log('algorithmParams-userAddress-bas', formatAddress);
    }
  }
  if (isFromSDK && padoZKAttestationJSSDKWalletAddress) {
    formatAddress = padoZKAttestationJSSDKWalletAddress;
    console.log('algorithmParams-userAddress-isFromSDK', formatAddress);
  }
  console.log(
    'algorithmParams-userAddress',
    connectedWalletAddress,
    padoZKAttestationJSSDKWalletAddress
  );

  const { id, token: loginToken } = JSON.parse(userInfo);
  const user = {
    userid: id,
    address: formatAddress,
    token: loginToken,
  };
  return user;
}

export const resetExchangesCipher = async (USERPASSWORD, newPwd) => {
  const sourceNameList = Object.keys(DATASOURCEMAP);
  const exCipherKeys = sourceNameList.map((i) => `${i}cipher`);
  let res = await chrome.storage.local.get(exCipherKeys);
  const cipherNameArr = Object.keys(res);
  for (let cipherName of cipherNameArr) {
    // decrypt
    const cipherData = res[cipherName];
    if (cipherData) {
      try {
        const apiKeyInfo = JSON.parse(decrypt(cipherData, USERPASSWORD));
        // encrypt
        const encryptedKey = encrypt(JSON.stringify(apiKeyInfo), newPwd);
        await chrome.storage.local.set({
          [cipherName]: JSON.stringify(encryptedKey),
        });
      } catch (err) {
        throw Error(err);
        console.log('resetExchangesCipher error:', err);
      }
    }
  }
  // cipherNameArr.forEach(async (cipherName) => {
  //   // decrypt
  //   const cipherData = res[cipherName];
  //   if (cipherData) {
  //     try {
  //       const apiKeyInfo = JSON.parse(decrypt(cipherData, USERPASSWORD));
  //       // encrypt
  //       const encryptedKey = encrypt(JSON.stringify(apiKeyInfo), newPwd);
  //       await chrome.storage.local.set({
  //         [cipherName]: JSON.stringify(encryptedKey),
  //       });
  //     } catch (err) {
  //       console.log('resetExchangesCipher error:', err);
  //     }
  //   }
  // });
};
