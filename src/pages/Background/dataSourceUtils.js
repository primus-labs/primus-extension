import { getCurrentDate, postMsg, sub, getAccount } from '@/utils/utils';
import { ExchangeStoreVersion, SocailStoreVersion } from '@/config/constants';
import { DATASOURCEMAP } from '@/config/dataSource2';
// ex : exhange service Constructor instance
export const storeDataSource = async (dataSourceId, ex, port, otherParams) => {
  otherParams = otherParams || {};
  const { apiKey, withoutMsg, attestationRequestid } = otherParams;
  const resType = `set-${dataSourceId}`;
  const exchangeInfo = DATASOURCEMAP[dataSourceId];
  const { type: sourceType, connectType } = exchangeInfo;
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
        apiKey: apiKey,
        // date: getCurrentDate(),
        // timestamp: +new Date(),
        version: ExchangeStoreVersion,
        label: '',
        flexibleAccountTokenMap: ex.flexibleAccountTokenMap,
        spotAccountTokenMap: ex.spotAccountTokenMap,
        tokenPriceMap: ex.tokenPriceMap,
        tradingAccountTokenAmountObj: ex.tradingAccountTokenAmountObj,
        userInfo: ex.userInfo, // new add
        spot30dVol: ex.spot30dVol,
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
    }
    Object.assign(newSourceUserData, {
      date: getCurrentDate(),
      timestamp: +new Date(),
      attestationRequestid,
    });
    
    // Store the individual data source info
    await chrome.storage.local.get([dataSourceId], async (result) => {
      console.log(`Storing data for ${dataSourceId}`, newSourceUserData);
      await chrome.storage.local.set({
        [dataSourceId]: JSON.stringify(newSourceUserData),
      });
      
      // IMPORTANT: Also update the socialSources object for social media platforms
      if (sourceType === 'Social') {
        try {
          // Get the current socialSources
          chrome.storage.local.get(['socialSources'], async (result) => {
            let socialSources = result.socialSources || {};
            
            // Handle case where socialSources is stored as a string
            if (typeof socialSources === 'string') {
              try {
                socialSources = JSON.parse(socialSources);
                console.log('Converted socialSources from string to object', socialSources);
              } catch (parseError) {
                console.error('Failed to parse socialSources string', parseError);
                socialSources = {};
              }
            }
            
            // Update the specific platform data
            socialSources[dataSourceId] = newSourceUserData;
            
            console.log(`Updating socialSources with ${dataSourceId} data`, {
              platformData: newSourceUserData,
              allPlatforms: Object.keys(socialSources)
            });
            
            // Save the updated socialSources
            await chrome.storage.local.set({ socialSources });
            
            // Also update activeConnectDataSource directly
            chrome.storage.local.get(['activeConnectDataSource'], (connectResult) => {
              const activeState = connectResult.activeConnectDataSource || {};
              if (activeState.dataSourceId === dataSourceId && activeState.loading === 1) {
                console.log(`Directly updating loading state for ${dataSourceId}`);
                chrome.storage.local.set({
                  activeConnectDataSource: {
                    ...activeState,
                    loading: 2 // Success state
                  }
                });
              }
            });
          });
        } catch (socialError) {
          console.error('Error updating socialSources:', socialError);
        }
      }
    });
    
    if (port) {
      try {
        postMsg(port, { resType, res: true, connectType, withoutMsg });
      } catch (portError) {
        console.log('Port communication error:', portError);
        // Port error is non-fatal since we've already updated storage
      }
    }
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

export const getDataSourceAccount = async (dataSourceId) => {
  let storages = await chrome.storage.local.get([dataSourceId]);
  let acc = '';
  if (storages[dataSourceId]) {
    acc = getAccount(
      DATASOURCEMAP[dataSourceId],
      JSON.parse(storages[dataSourceId])
    );
  }
  return acc;
};
