import { encrypt, decrypt } from '@/utils/crypto';
import {
  DATASOURCEMAP,
  CredVersion,
  ExchangeStoreVersion,
} from '@/config/constants';
import { PADOURL, PROXYURL } from '@/config/envConstants';
import { getCurrentDate, sub, postMsg, strToHex } from '@/utils/utils';

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
      try {
        const exchange = await getExchange(message, USERPASSWORD, port);
        const ex = exchange.ex;
        const exParams = exchange.exParams;
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
          tokenPriceMap: ex.tokenPriceMap,
          tradingAccountTokenAmountObj: ex.tradingAccountTokenAmountObj,
        };
        console.log(`background--${exchangeName}exData`, ex);
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
            label,
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
          postMsg(port, { resType: type, res: true });
        } else if (EXCHANGEINFO[exchangeName]?.apiKey) {
          await chrome.storage.local.set({
            [exchangeName]: JSON.stringify(exData),
          });
          postMsg(port, { resType: type, res: true });
        } else {
          await chrome.storage.local.set({
            [exchangeName]: JSON.stringify(exData),
          });
          EXCHANGEINFO[exchangeName] = exParams;
          postMsg(port, { resType: type, res: true });
        }
      } catch (error) {
        console.log(
          'exData',
          error,
          error.message,
          error.message.indexOf('AuthenticationError')
        );
        if (error.message.indexOf('AuthenticationError') > -1) {
          postMsg(port, {
            resType: type,
            res: false,
            msg: 'AuthenticationError',
          });
        } else if (error.message.indexOf('ExchangeNotAvailable') > -1) {
          postMsg(port, {
            resType: type,
            res: false,
            msg: 'ExchangeNotAvailable',
          });
        } else if (error.message.indexOf('InvalidNonce') > -1) {
          postMsg(port, { resType: type, res: false, msg: 'InvalidNonce' });
        } else if (error.message.indexOf('RequestTimeout') > -1) {
          // postMsg(port,{ resType: type, res: false, msg: 'RequestTimeout' }) // cctx-10s
          postMsg(port, {
            resType: type,
            res: false,
            msg: 'TypeError: Failed to fetch',
          });
        } else if (error.message.indexOf('NetworkError') > -1) {
          postMsg(port, {
            resType: type,
            res: false,
            msg: 'TypeError: Failed to fetch',
          });
        } else if (error.message.indexOf('TypeError: Failed to fetch') > -1) {
          postMsg(port, {
            resType: type,
            res: false,
            msg: 'TypeError: Failed to fetch',
          });
        } else {
          postMsg(port, { resType: type, res: false, msg: 'UnhnowError' });
        }
      }
      break;
    default:
      break;
  }
};
export default processNetworkReq;

export async function assembleAlgorithmParams(form, USERPASSWORD, port) {
  const {
    source,
    type,
    baseValue,
    token: holdingToken,
    label,
    exUserId,
    requestid: prevRequestid,
  } = form;
  const { baseName, baseUrl } = DATASOURCEMAP[source];
  const user = await assembleUserInfoParams();
  const extRequestsOrderInfo = await assembleAccountBalanceRequestParams(
    form,
    USERPASSWORD,
    port
  );

  const { userInfo } = await chrome.storage.local.get(['userInfo']);
  const { id: authUserId } = JSON.parse(userInfo);
  const authUseridHash = strToHex(authUserId);

  const timeStampStr = (+new Date()).toString();
  const schemaTypeMap = {
    ASSETS_PROOF: 'Assets Proof',
    TOKEN_HOLDINGS: 'Token Holdings',
    IDENTIFICATION_PROOF: 'IDENTIFICATION_PROOF',
  };
  const schemaType = schemaTypeMap[type];
  const params = {
    type,
    label,
    exUserId,
    source,
    requestid: prevRequestid || timeStampStr,
    version: CredVersion,
    baseName, // host, such as "api.binance.com"
    baseUrl, // client <----> http-server
    padoUrl: PADOURL, // client <----> pado-server // TODO
    proxyUrl: PROXYURL, // TODO
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
    // schemaType: 'exchange-balance', // TODO
    schemaType,
    schema: [
      // TODO
      { name: 'source', type: 'string' },
      { name: 'sourceUseridHash', type: 'string' },
      { name: 'authUseridHash', type: 'string' },
      { name: 'receipt', type: 'string' },
      { name: 'getDataTime', type: 'string' },
      { name: 'baseValue', type: 'string' },
      { name: 'balanceGreaterThanBaseValue', type: 'string' },
    ],
    user,

    // holdingToken // TODO
    authUseridHash,
  };
  let calculationType;
  const sourceUpperCaseName = source.toUpperCase();
  if (type === 'ASSETS_PROOF') {
    params.baseValue = baseValue;
    calculationType = `SUM_OF_ALL`;
    if (source === 'binance') {
      calculationType = 'KEY_VALUES_SUM_X_A';
    }
  } else if (type === 'TOKEN_HOLDINGS') {
    params.baseValue = '0';
    params.holdingToken = holdingToken;
    calculationType = `SUM_OF__A_KEY_VALUES`; // TODO
  }

  let extRequestsOrder;
  if (source === 'binance') {
    extRequestsOrder = 'asset-balances';
  } else {
    extRequestsOrder = 'account-balance';
  }
  const ext = {
    calculationType: calculationType, // NO_ACTION/A_PURE_NUMBER/OKX_ACCOUNT_BALANCE/OKX_ASSET_BALANCES
    extRequests: {
      orders: [extRequestsOrder], // TODO
      [extRequestsOrder]: extRequestsOrderInfo,
    },
  };
  params.ext = ext;

  return params;
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
      console.log('binance signres=', signres);
      extRequestsOrderInfo = { ...signres };
      break;
    case 'coinbase':
      data = {
        path: 'accounts',
        api: ['v2', 'private'],
        method: 'GET',
        params: {},
      };
      signres = await sign('coinbase', data, USERPASSWORD, port);
      if (form.type === 'TOKEN_HOLDINGS') {
        signres.parseSchema =
          'MAP_A_PURE_NUMBER_REGEX:VK:"amount":"(.*?)"[\\s\\S]*?"currency":"(.*?)"';
      }
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
