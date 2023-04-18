import { encrypt, decrypt } from '@/utils/crypto';
import { DATASOURCEMAP } from '@/utils/constants';
import { getCurrentDate, sub, gt } from '@/utils/utils';
import { ExchangeStoreVersion } from '@/utils/constants';

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
const processNetworkReq = async (message, port, USERPASSWORD) => {
  var {
    type,
    params: { apiKey, secretKey, passphase, name, exData },
  } = message;
  const exchangeName = type.split('-')[1];
  switch (type) {
    case 'set-binance':
    case 'set-okx':
    case 'set-kucoin':
    case 'set-coinbase':
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
        if (cipherData) {
          const apiKeyInfo = JSON.parse(
            decrypt(cipherData[exchangeName + 'cipher'], USERPASSWORD)
          );
          exParams = { ...apiKeyInfo };
        }
      }
      // request ex data
      const exchangeInfo = DATASOURCEMAP[exchangeName];
      const constructorF = exchangeInfo.constructorF;
      const ex = new constructorF(exParams);
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
        version: ExchangeStoreVersion,
      };
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
        };
        const encryptedKey = encrypt(
          JSON.stringify(exCipherData),
          USERPASSWORD
        );
        await chrome.storage.local.set({
          [exchangeName]: JSON.stringify(exData),
          [exchangeName + 'cipher']: JSON.stringify(encryptedKey),
        });
        EXCHANGEINFO[exchangeName] = exParams;
        port.postMessage({ resType: type, res: true });
      } else if (EXCHANGEINFO[exchangeName]?.apiKey) {
        await chrome.storage.local.set({
          [exchangeName]: JSON.stringify(exData),
        });
        port.postMessage({ resType: type, res: true });
      } else {
        await chrome.storage.local.set({
          [exchangeName]: JSON.stringify(exData),
        });
        EXCHANGEINFO[exchangeName] = exParams;
        port.postMessage({ resType: type, res: true });
      }
      break;
    default:
      break;
  }
};
export default processNetworkReq;
