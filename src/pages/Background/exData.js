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

export async function sign(exchangeName, data, port, USERPASSWORD) {
  const message = {
    type: `sign-${exchangeName}`,
    params: {}
  };
  const exchange = await getExchange(message, port, USERPASSWORD);
  const res = exchange.ex.exchange.sign(data.path, data.api, data.method, data.params, data.headers, data.body);
  EXCHANGEINFO[exchangeName] = exchange.exParams;
  return res;
}
export async function assembleAlgorithmParams(form) {
  const { source, type, baseValue, token: holdingToken } = form;
  // const activeForm = { ...form }
  // delete activeForm.type
  const { baseName, baseUrl } = DATASOURCEMAP[source];
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

  const params = {
    source,
    requestid: (+new Date()).toString(),
    version: padoExtensionVersion,
    baseName, // host, such as "api.binance.com"
    baseUrl, // client <----> http-server
    padoUrl: PADOURL, // client <----> pado-server
    proxyUrl: PROXYURL,
    // if cipher non-exist or empty use default. options:
    //    ECDHE-RSA-AES128-GCM-SHA256(default), ECDHE-ECDSA-AES128-GCM-SHA256
    cipher: '', // TODO
    getdatatime: (+new Date()).toString(),
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
    // ext,

    // holdingToken
  };
  
  if (type === 'Assets Proof') {
    params.baseValue = baseValue;
  } else if (type === 'Token Holdings') {
    params.holdingToken = holdingToken;
  }
  // const ext = {};
  // const parseSchema
  // parmas.ext = ext
  // if (type === 'Assets Proof') {
  //   params.baseValue = baseValue;
  //   const sourceUpperCaseName = source.toUpperCase()
  //   parseSchema = `${sourceUpperCaseName}_ACCOUNT_BALANCE`
  // } else if (type === 'Token Holdings') {
  //   params.holdingToken = holdingToken;
  // }
  // // TODO
  
  // const ext = {
  //   parseSchema: 'OKX_ACCOUNT_BALANCE', // NO_ACTION/A_PURE_NUMBER/OKX_ACCOUNT_BALANCE/OKX_ASSET_BALANCES
  //   extRequests: {
  //     orders: ['account-balance'],
  //     'account-balance': {
  //       //decrypt: "true",
  //       url: 'https://www.okx.com/api/v5/account/balance',
  //       method: 'GET',
  //       headers: {
  //         'OK-ACCESS-KEY': '8a236275-eedc-46d9-a592-485fb38d1dfe',
  //         'OK-ACCESS-PASSPHRASE': 'Padopado@2022',
  //         'OK-ACCESS-SIGN': 'LGCcfSvL00ejKcXLQ7KUCVS68AeUX8RN9htSzBcvxDM=',
  //         'OK-ACCESS-TIMESTAMP': '2023-05-19T07:21:26.379Z',
  //       }, // "key":"value"
  //       body: {}, // "key":"value"
  //     },
  //   },
  // };
  // params = {
  //   requestid: '1', // unique
  //   version: '1.0.0',
  //   source: 'okx',
  //   baseName: 'www.okx.com', // host, such as "api.binance.com"
  //   baseUrl: '104.18.2.151:443', // client <----> http-server
  //   padoUrl: '127.0.0.1:8081', // client <----> pado-server
  //   proxyUrl: '127.0.0.1:9000',
  //   // if cipher non-exist or empty use default. options:
  //   //    ECDHE-RSA-AES128-GCM-SHA256(default), ECDHE-ECDSA-AES128-GCM-SHA256
  //   cipher: '',
  //   getdatatime: (+new Date()).toString(),
  //   exchange: {
  //     apikey: 'xxx',
  //     apisecret: 'xxx',
  //     apipassword: 'xxx',
  //   },
  //   sigFormat: 'EAS-Ethereum',
  //   schemaType: 'exchange-balance',
  //   schema: [
  //     { name: 'source', type: 'string' },
  //     { name: 'useridhash', type: 'string' },
  //     { name: 'address', type: 'string' },
  //     { name: 'getdatatime', type: 'string' },
  //     { name: 'baseValue', type: 'string' },
  //     { name: 'balanceGreaterBaseValue', type: 'string' },
  //   ],
  //   user: {
  //     userid: '0123456789',
  //     address: '0x2A46883d79e4Caf14BCC2Fbf18D9f12A8bB18D07',
  //     token: 'xxx',
  //   },
  //   baseValue: '1000',
  //   ext: {
  //     parseSchema: 'OKX_ACCOUNT_BALANCE', // NO_ACTION/A_PURE_NUMBER/OKX_ACCOUNT_BALANCE/OKX_ASSET_BALANCES
  //     extRequests: {
  //       orders: ['account-balance'],
  //       'account-balance': {
  //         //decrypt: "true",
  //         url: 'https://www.okx.com/api/v5/account/balance',
  //         method: 'GET',
  //         headers: {
  //           'OK-ACCESS-KEY': '8a236275-eedc-46d9-a592-485fb38d1dfe',
  //           'OK-ACCESS-PASSPHRASE': 'Padopado@2022',
  //           'OK-ACCESS-SIGN': 'LGCcfSvL00ejKcXLQ7KUCVS68AeUX8RN9htSzBcvxDM=',
  //           'OK-ACCESS-TIMESTAMP': '2023-05-19T07:21:26.379Z',
  //         }, // "key":"value"
  //         body: {}, // "key":"value"
  //       },
  //     },
  //     signHash: {
  //       trueHash:
  //         '0x78dcd376165ff92037130b1a73f49b9ebc2d1dc3e0bac9b9e29c4991ebdd84ef',
  //       falseHash:
  //         '0x092c22fe27704e9b0c9b58550e78cb53b621930844a8008fc8a644aaccb0fa43',
  //     },
  //   },
  // };
  return {};
}

const getExchange = async (message, port, USERPASSWORD) => {
  var {
    type,
    params: { apiKey},
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
    const cipherData = await chrome.storage.local.get(
      exchangeName + 'cipher'
    );
    if(!USERPASSWORD) {
      postMsg(port,{
        resType: 'lock',
      })
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
  return {ex: ex, exParams: exParams };
}

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
