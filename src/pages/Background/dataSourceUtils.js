import { getCurrentDate, postMsg, sub } from '@/utils/utils';
import { DATASOURCEMAP } from '@/config/dataSource';
import { ExchangeStoreVersion, SocailStoreVersion } from '@/config/constants';
// ex : exhange service Constructor instance
export const storeDataSource = async (dataSourceId, ex, port, otherParams) => {
  otherParams = otherParams || {};
  const { apiKey, withoutMsg } = otherParams;
  const resType = `set-${dataSourceId}`;
  const exchangeInfo = DATASOURCEMAP[dataSourceId];
  const { constructorF, type: sourceType, connectType } = exchangeInfo;
  try {
    // const ex = new constructorF();
    await ex.getInfo();
    console.log(`222dataSourceWeb getInfo ${dataSourceId}= `, ex);
    var newSourceUserData = {};
    let storageRes = await chrome.storage.local.get(dataSourceId);
    const lastData = storageRes[dataSourceId];
    let pnl = null;
    if (sourceType === 'Assets') {
      if (lastData) {
        const lastTotalBal = JSON.parse(lastData).totalBalance;
        pnl = sub(ex.totalAccountBalance, lastTotalBal).toFixed();
      }
      newSourceUserData = {
        totalBalance: ex.totalAccountBalance,
        tokenListMap: ex.totalAccountTokenMap,
        apiKey: apiKey, // TODO-newui
        // date: getCurrentDate(),
        // timestamp: +new Date(),
        version: ExchangeStoreVersion, // TODO-newui
        label: '', // TODO-newui
        flexibleAccountTokenMap: ex.flexibleAccountTokenMap,
        spotAccountTokenMap: ex.spotAccountTokenMap,
        tokenPriceMap: ex.tokenPriceMap,
        tradingAccountTokenAmountObj: ex.tradingAccountTokenAmountObj,
        userInfo: ex.userInfo, // new add
      };
      if (dataSourceId === 'binance') {
        newSourceUserData.tradingAccountFreeTokenAmountObj =
          ex.tradingAccountFreeTokenAmountObj;
      }
      if (pnl !== null && pnl !== undefined) {
        newSourceUserData.pnl = pnl;
      }
    } else if (sourceType === 'Social') {
      if (lastData) {
        const lastTotalBal = JSON.parse(lastData).followers;
        pnl = sub(ex.followers, lastTotalBal).toFixed();
      }
      if (pnl !== null && pnl !== undefined) {
        ex.pnl = pnl;
      }
      newSourceUserData = {
        ...ex,
        version: SocailStoreVersion,
      };
      // postMsg(port, { resMethodName: 'checkIsLogin', res: false });
    }
    Object.assign(newSourceUserData, {
      date: getCurrentDate(),
      timestamp: +new Date(),
    });
    await chrome.storage.local.set({
      [dataSourceId]: JSON.stringify(newSourceUserData),
    });
    postMsg(port, { resType, res: true, connectType, withoutMsg });
  } catch (error) {
    console.log(
      'connect source  error',
      error,
      error.message,
      error.message.indexOf('AuthenticationError')
    );
    var errMsg = '';
    if (sourceType === 'Assets') {
      if (error.message.indexOf('AuthenticationError') > -1) {
        errMsg = 'AuthenticationError';
      } else if (error.message.indexOf('ExchangeNotAvailable') > -1) {
        errMsg = 'ExchangeNotAvailable';
      } else if (error.message.indexOf('InvalidNonce') > -1) {
        errMsg = 'InvalidNonce';
      } else if (error.message.indexOf('RequestTimeout') > -1) {
        errMsg = 'TypeError: Failed to fetch';
      } else if (error.message.indexOf('NetworkError') > -1) {
        errMsg = 'TypeError: Failed to fetch';
      } else if (error.message.indexOf('TypeError: Failed to fetch') > -1) {
        errMsg = 'TypeError: Failed to fetch';
      } else {
        errMsg = 'UnhnowError';
      }
    } else if (sourceType === 'Social') {
      // TODO-newui
      errMsg = 'UnhnowError';
    }
    postMsg(port, {
      resType,
      res: false,
      msg: errMsg,
      connectType,
      withoutMsg,
    });
  }
};
