export const storeDataSource = () => {
   const ex = new constructorF();
        await ex.getInfo();
        console.log(`222dataSourceWeb getInfo ${exchangeName}= `, ex);
        var newSourceUserData = {};
        if (sourceType === 'Assets') {
          let storageRes = await chrome.storage.local.get(exchangeName);
          const lastData = storageRes[exchangeName];
          let pnl = null;
          if (lastData) {
            const lastTotalBal = JSON.parse(lastData).totalBalance;
            pnl = sub(ex.totalAccountBalance, lastTotalBal).toFixed();
          }
          newSourceUserData = {
            totalBalance: ex.totalAccountBalance,
            tokenListMap: ex.totalAccountTokenMap,
            // apiKey: exParams.apiKey, // TODO-newui
            date: getCurrentDate(),
            timestamp: +new Date(),
            version: ExchangeStoreVersion, // TODO-newui
            label: '', // TODO-newui
            flexibleAccountTokenMap: ex.flexibleAccountTokenMap,
            spotAccountTokenMap: ex.spotAccountTokenMap,
            tokenPriceMap: ex.tokenPriceMap,
            tradingAccountTokenAmountObj: ex.tradingAccountTokenAmountObj,
            userInfo: ex.userInfo,
          };
          if (pnl !== null && pnl !== undefined) {
            newSourceUserData.pnl = pnl;
          }
        } else if (sourceType === 'Social') {
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
          [exchangeName]: JSON.stringify(newSourceUserData),
        });
        postMsg(port, { resType, res: true, connectType: 'Web' });
      } catch (error) {
        console.log(
          'connect source  by web error',
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
}