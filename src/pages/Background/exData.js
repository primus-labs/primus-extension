import { encrypt, decrypt } from '@/utils/crypto';
import {
  DATASOURCEMAP,
  padoExtensionVersion,
  ExchangeStoreVersion,
  PADOURL,
  PROXYURL,
} from '@/utils/constants';
import { getCurrentDate, sub, postMsg } from '@/utils/utils';


let EXCHANGEINFO = {
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
  console.log('getExchange exData type:', type);
  // get ex constructor params
  let exParams = {};
  if (apiKey) {
    exParams = message.params;
  } else if (EXCHANGEINFO[exchangeName]?.apiKey) {
    exParams = EXCHANGEINFO[exchangeName];
  } else {
    const cipherData = await chrome.storage.local.get(exchangeName + 'cipher');
    if (!USERPASSWORD) {
      postMsg(port, {
        resType: 'lock',
      });
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

  // request ex data
  const exchangeInfo = DATASOURCEMAP[exchangeName];
  const constructorF = exchangeInfo.constructorF;
  const ex = new constructorF(exParams);
  return { ex: ex, exParams: exParams };
};

const processNetworkReq = async (message, port, USERPASSWORD) => {
  var {
    type,
    params: { apiKey, secretKey, passphase, name, exData, label },
  } = message;
  const exchangeName = type.split('-')[1];
  switch (type) {
    case 'set-binance':
    case 'set-okx':
    case 'set-kucoin':
    case 'set-coinbase':
    case 'set-huobi':
    case 'set-bitget':
    case 'set-bybit':
    case 'set-gate':
    case 'set-mexc':
      console.log('exData type:', type);
      try{
        const exchange = await getExchange(message, port, USERPASSWORD);
        const ex = exchange.ex;
        const exParams =exchange.exParams;
        await ex.getInfo();
        // compute changes from last time => pnl
        let storageRes = await chrome.storage.local.get(exchangeName);
        const lastData = storageRes[exchangeName];
        let pnl = null;
        if (lastData) {
          const lastTotalBal = JSON.parse(lastData).totalBalance;
          pnl = sub(ex.totalAccountBalance, lastTotalBal).toFixed();
        }
        const exData = {
          totalBalance: ex.totalAccountBalance,
          tokenListMap: ex.totalAccountTokenMap,
          apiKey: exParams.apiKey,
          date: getCurrentDate(),
          timestamp: +new Date(),
          version: ExchangeStoreVersion,
          label: exParams.label,
          flexibleAccountTokenMap: ex.flexibleAccountTokenMap,
          spotAccountTokenMap: ex.spotAccountTokenMap,
          tokenPriceMap: ex.tokenPriceMap
        };
        console.log(`background--${exchangeName}exData`, ex)
        if (pnl !== null && pnl !== undefined) {
          exData.pnl = pnl;
        }
        // store data
        if (apiKey) {
          const { apiKey, secretKey, passphase } = exParams;
          const exCipherData = {
            apiKey,
            secretKey,
            passphase,
            label
          };
          const encryptedKey = encrypt(
            JSON.stringify(exCipherData),
            USERPASSWORD
          );
          // TODO get storage from store first,then store new info of new apikey
          await chrome.storage.local.set({
            [exchangeName]: JSON.stringify(exData),
            [exchangeName + 'cipher']: JSON.stringify(encryptedKey),
          });
          EXCHANGEINFO[exchangeName] = exParams;
          postMsg(port,{ resType: type, res: true })
        } else if (EXCHANGEINFO[exchangeName]?.apiKey) {
          await chrome.storage.local.set({
            [exchangeName]: JSON.stringify(exData),
          });
          postMsg(port,{ resType: type, res: true })
        } else {
          await chrome.storage.local.set({
            [exchangeName]: JSON.stringify(exData),
          });
          EXCHANGEINFO[exchangeName] = exParams;
          postMsg(port,{ resType: type, res: true })
        }
      } catch (error) {
        console.log('exData', error,error.message, error.message.indexOf('AuthenticationError'))
        if(error.message.indexOf('AuthenticationError')> -1) {
          postMsg(port,{ resType: type, res: false, msg: 'AuthenticationError' })
        } else if(error.message.indexOf('ExchangeNotAvailable')> -1) {
          postMsg(port,{ resType: type, res: false, msg: 'ExchangeNotAvailable' })
        } else if(error.message.indexOf('InvalidNonce')> -1) {
          postMsg(port,{ resType: type, res: false, msg: 'InvalidNonce' })
        } else if (error.message.indexOf('RequestTimeout')> -1) {
          // postMsg(port,{ resType: type, res: false, msg: 'RequestTimeout' }) // cctx-10s
          postMsg(port,{ resType: type, res: false, msg: 'TypeError: Failed to fetch' })
        } else if (error.message.indexOf('NetworkError')> -1) {
          postMsg(port,{ resType: type, res: false, msg: 'TypeError: Failed to fetch' })
        } else if (error.message.indexOf('TypeError: Failed to fetch')> -1) {
          postMsg(port,{ resType: type, res: false, msg: 'TypeError: Failed to fetch' })
        } else {
          postMsg(port,{ resType: type, res: false, msg: 'UnhnowError' })
        }
      }
      break;
    default:
      break;
  }
};
export default processNetworkReq;

export async function assembleAlgorithmParams(form, USERPASSWORD, port) {
  const { source, type, baseValue, token: holdingToken,label, exUserId } = form;
  const { baseName, baseUrl } = DATASOURCEMAP[source];
  const user = await assembleUserInfoParams();
  const extRequestsOrderInfo = await assembleAccountBalanceRequestParams(
    source,
    USERPASSWORD,
    port
  );
  const timeStampStr = (+new Date()).toString();
  const params = {
    type,
    label,
    exUserId,
    source,
    requestid: timeStampStr,
    version: padoExtensionVersion,
    baseName, // host, such as "api.binance.com"
    baseUrl, // client <----> http-server
    padoUrl: PADOURL, // client <----> pado-server
    proxyUrl: PROXYURL,
    // if cipher non-exist or empty use default. options:
    //    ECDHE-RSA-AES128-GCM-SHA256(default), ECDHE-ECDSA-AES128-GCM-SHA256
    cipher: '', // TODO
    getdatatime: timeStampStr,
    exchange: {
      apikey: 'xxx',
      apisecret: 'xxx',
      apipassword: 'xxx',
    },
    sigFormat: 'EAS-Ethereum', // TODO
    schemaType: 'exchange-balance', // TODO
    schema: [
      // TODO
      { name: 'source', type: 'string' },
      { name: 'useridhash', type: 'string' },
      { name: 'address', type: 'string' },
      { name: 'getdatatime', type: 'string' },
      { name: 'baseValue', type: 'string' },
      { name: 'balanceGreaterBaseValue', type: 'string' },
    ],
    user,

    // holdingToken // TODO
  };
  let parseSchema;
  const sourceUpperCaseName = source.toUpperCase();
  if (type === 'Assets Proof') {
    params.baseValue = baseValue;
    parseSchema = `${sourceUpperCaseName}_ACCOUNT_BALANCE`;
  } else if (type === 'Token Holdings') {
    params.holdingToken = holdingToken;
    parseSchema = `${sourceUpperCaseName}_ASSET_BALANCES`;
  }
  let extRequestsOrder = 'account-balance';
  const ext = {
    parseSchema: parseSchema, // NO_ACTION/A_PURE_NUMBER/OKX_ACCOUNT_BALANCE/OKX_ASSET_BALANCES
    extRequests: {
      orders: [extRequestsOrder], // TODO
      [extRequestsOrder]: extRequestsOrderInfo,
    },
  };
  params.ext = ext;

  return params;
}
async function assembleAccountBalanceRequestParams(source, USERPASSWORD, port) {
  const sourceLowerCaseName = source.toLowerCase();
  let extRequestsOrderInfo = {};
  switch (sourceLowerCaseName) {
    case 'binance':
      break;
    case 'okx':
      const data = {
        path: 'account/balance',
        api: 'private',
        method: 'GET',
        params: {},
      };
      const signres = await sign('okx', data, USERPASSWORD, port);
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
      break;
    default:
      break;
  }
  return extRequestsOrderInfo;
}
async function assembleUserInfoParams() {
  const { keyStore, userInfo } = await chrome.storage.local.get([
    'keyStore',
    'userInfo',
  ]);
  const { address } = JSON.parse(keyStore);
  const { id, token: loginToken } = JSON.parse(userInfo);
  const user = {
    userid: id,
    address: '0x' + address,
    token: loginToken,
  };
  return user;
}

