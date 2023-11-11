import type { AssetsMap } from '@/components/DataSourceOverview/DataSourceList/DataSourceItem';
import { DATASOURCEMAP, ONEMINUTE } from '@/config/constants';
import type { ExchangeMeta } from '@/types/dataSource';
import type { DataSourceStorages } from '@/pages/DataSourceOverview';
import { getProofTypes } from '@/services/api/config';
import type { PROOFTYPEITEM } from '@/types/cred';
import { connectWallet, requestSign } from '@/services/wallets/metamask';
import {
  DEFAULTDATASOURCEPOLLINGTIMENUM,
  SCROLLEVENTNAME,
} from '@/config/constants';
import {
  bindConnectedWallet,
  checkIfBindConnectedWallet,
} from '@/services/api/user';
import { queryBadgeEventPeriod } from '@/services/api/event';
import { getAssetsOnChains } from '@/services/api/dataSource';
import { sub, getStatisticalData, getCurrentDate } from '@/utils/utils';
import { eventReport } from '@/services/api/usertracker';

export const SETSYSCONFIG = 'SETSYSCONFIG';

type ExInfo = {
  date: string;
  apiKey: string;
  totalBalance: string;
  tokenListMap: AssetsMap;
};

export type ExDataMap = {
  [propName: string]: ExInfo & ExchangeMeta;
};

export const setOnChainAssetsSources = (values: any) => ({
  type: 'setOnChainAssetsSources',
  payload: values,
});
export const setCredentialsAction = (values: any) => ({
  type: 'setCredentials',
  payload: values,
});
export const setProofTypesAction = (values: any) => ({
  type: 'setProofTypes',
  payload: values,
});
export const setWebProofTypesAction = (values: any) => ({
  type: 'setWebProofTypes',
  payload: values,
});
export const setSocialSourcesAction = (values: object) => ({
  type: 'setSocialSources',
  payload: values,
});
export const setExSourcesData = (values: object) => ({
  type: 'setExSources',
  payload: values,
});
export const setKYCsAction = (values: object) => ({
  type: 'setKYCs',
  payload: values,
});
export const setSourceUpdateFrequencyAction = (values: string) => ({
  type: 'setSourceUpdateFrequency',
  payload: values,
});
export const setUserInfoAction = (values: object) => ({
  type: 'setUserInfo',
  payload: values,
});
export const setWalletAddressAction = (values: string) => ({
  type: 'setWalletAddress',
  payload: values,
});
export const setRewardsAction = (values: object) => ({
  type: 'setRewards',
  payload: values,
});
export const setConnectWalletDialogVisibleAction = (values: boolean) => ({
  type: 'setConnectWalletDialogVisible',
  payload: values,
});
export const setConnectWalletAction = (values: any) => ({
  type: 'setConnectWallet',
  payload: values,
});
export const setRewardsDialogVisibleAction = (values: any) => ({
  type: 'setRewardsDialogVisibleAction',
  payload: values,
});
export const setBadgeEventPeriodAction = (values: any) => ({
  type: 'setBadgeEventPeriodAction',
  payload: values,
});
export const setScrollEventPeriodAction = (values: any) => ({
  type: 'setScrollEventPeriodAction',
  payload: values,
});
export const setConnectWalletActionAsync = (values: any) => {
  return async (dispatch: any) => {
    if (values?.address) {
      const { address, name } = values;
      await chrome.storage.local.set({
        connectedWalletAddress: JSON.stringify({
          name,
          address,
        }),
      });
      await dispatch(setConnectWalletAction(values));
      await dispatch(setConnectWalletDialogVisibleAction(false));
    } else {
      await chrome.storage.local.remove(['connectedWalletAddress']);
      await dispatch(setConnectWalletAction(values));
    }
  };
};
export const connectWalletAsync = (
  connectObj?: any,
  startFn?: any,
  errorFn?: any,
  sucFn?: any,
  network?: any
) => {
  return async (dispatch: any) => {
    try {
      let address;
      let provider;
      if (connectObj) {
        address = connectObj.address;
        provider = connectObj.provider;
      } else {
        const connectRes = await connectWallet(network);
        provider = connectRes[2];
        address = (connectRes[0] as string[])[0];
      }

      const type = 'metamask';
      const checkRes = await checkIfBindConnectedWallet({ address });
      if (checkRes.rc === 0 && checkRes.result) {
        await dispatch(
          setConnectWalletActionAsync({ name: type, address, provider })
        );
        await dispatch(setConnectWalletDialogVisibleAction(false));
        if (sucFn) {
          startFn && (await startFn());
          sucFn && (await sucFn({ name: type, address, provider }));
        } else {
          return;
        }
      } else {
        startFn && (await startFn());
        await dispatch(setConnectWalletDialogVisibleAction(true));
        const timestamp: string = +new Date() + '';
        const signature = await requestSign(address, timestamp);
        if (!signature) {
          errorFn && (await errorFn());
          return;
        }
        const res = await bindConnectedWallet({
          signature,
          timestamp,
          address,
          type,
        });
        const { rc, result } = res;
        if (rc === 0 && result) {
          await dispatch(
            setConnectWalletActionAsync({ name: type, address, provider })
          );
          await dispatch(setConnectWalletDialogVisibleAction(false));
          sucFn && (await sucFn({ name: type, address, provider }));

          getChainAssets(signature, timestamp, address, dispatch);
        }
      }
    } catch (e) {
      console.log('connectWalletAsync catch e=', e);
      errorFn && errorFn();
    }
  };
};

const getChainAssets = async (
  signature: string,
  timestamp: string,
  curConnectedAddr: string,
  dispatch: any
) => {
  const { rc, result, msg } = await getAssetsOnChains(
    {
      signature,
      timestamp,
      address: curConnectedAddr,
    },
    {
      timeout: ONEMINUTE,
    }
  );

  if (rc === 0) {
    const res = getStatisticalData(result);
    const curAccOnChainAssetsItem: any = {
      address: curConnectedAddr,
      label: '',
      date: getCurrentDate(),
      timestamp,
      signature,
      ...res,
      ...DATASOURCEMAP['onChain'],
    };

    const { onChainAssetsSources: lastOnChainAssetsMapStr } =
      await chrome.storage.local.get(['onChainAssetsSources']);

    const lastOnChainAssetsMap = lastOnChainAssetsMapStr
      ? JSON.parse(lastOnChainAssetsMapStr)
      : {};
    if (curConnectedAddr in lastOnChainAssetsMap) {
      const lastCurConnectedAddrInfo = lastOnChainAssetsMap[curConnectedAddr];
      const pnl = sub(
        curAccOnChainAssetsItem.totalBalance,
        lastCurConnectedAddrInfo.totalBalance
      ).toFixed();

      curAccOnChainAssetsItem.pnl = pnl;
      curAccOnChainAssetsItem.time = pnl;
    }
    lastOnChainAssetsMap[curConnectedAddr] = curAccOnChainAssetsItem;

    await chrome.storage.local.set({
      onChainAssetsSources: JSON.stringify(lastOnChainAssetsMap),
    });

    await dispatch(setOnChainAssetsSourcesAsync());

    const eventInfo = {
      eventType: 'DATA_SOURCE_INIT',
      rawData: { type: 'Assets', dataSource: 'onchain-ConnectWallet' },
    };
    eventReport(eventInfo);
  }
};

export const initRewardsActionAsync = () => {
  return async (dispatch: any) => {
    const { rewards } = await chrome.storage.local.get(['rewards']);
    if (rewards) {
      const rewardsObj = JSON.parse(rewards);
      dispatch(setRewardsAction(rewardsObj));
    }
  };
};
export const setBadgeEventPeriodActionAsync = () => {
  return async (dispatch: any) => {
    try {
      const eventPeriodRes = await Promise.all([
        queryBadgeEventPeriod(),
        queryBadgeEventPeriod({
          event: SCROLLEVENTNAME,
        }),
      ]);
      eventPeriodRes.forEach((i, k) => {
        const { rc, result } = i;
        if (k === 0) {
          if (rc === 0) {
            dispatch(setBadgeEventPeriodAction(result));
          }
        } else if (k === 1) {
          if (rc === 0) {
            dispatch(setScrollEventPeriodAction(result));
          }
        }
      });
    } catch (e) {
      console.log('setBadgeEventPeriodActionAsync e:', e);
    }
  };
};
// export const setUserInfoActionAsync = (value: string) => {
//   return async (dispatch: any) => {
//     await chrome.storage.local.set({
//       userInfo: value,
//     });
//     dispatch(setUserInfoAction(value));
//   };
// };
export const initUserInfoActionAsync = () => {
  return async (dispatch: any) => {
    const { userInfo } = await chrome.storage.local.get(['userInfo']);
    if (userInfo) {
      const userInfoObj = JSON.parse(userInfo);
      dispatch(setUserInfoAction(userInfoObj));
    }
  };
};
export const initWalletAddressActionAsync = () => {
  return async (dispatch: any) => {
    const { keyStore, padoCreatedWalletAddress } =
      await chrome.storage.local.get(['keyStore', 'padoCreatedWalletAddress']);
    if (keyStore) {
      const { address } = JSON.parse(keyStore);
      dispatch(setWalletAddressAction('0x' + address));
    } else {
      dispatch(setWalletAddressAction(padoCreatedWalletAddress));
    }
  };
};

export const setSourceUpdateFrequencyActionAsync = (value: string) => {
  return async (dispatch: any) => {
    await chrome.storage.local.set({
      dataSourcesUpdateFrequency: value,
    });
    dispatch(setSourceUpdateFrequencyAction(value));
  };
};

export const initSourceUpdateFrequencyActionAsync = () => {
  return async (dispatch: any) => {
    let { dataSourcesUpdateFrequency } = await chrome.storage.local.get([
      'dataSourcesUpdateFrequency',
    ]);
    if (dataSourcesUpdateFrequency) {
      dispatch(setSourceUpdateFrequencyAction(dataSourcesUpdateFrequency));
    } else {
      dispatch(
        setSourceUpdateFrequencyActionAsync(DEFAULTDATASOURCEPOLLINGTIMENUM)
      );
    }
  };
};
export const setExSourcesAsync = () => {
  return async (dispatch: any) => {
    const sourceNameList = Object.keys(DATASOURCEMAP).filter(
      (i) => DATASOURCEMAP[i].type === 'Assets'
    );
    let res: DataSourceStorages = await chrome.storage.local.get(
      sourceNameList
    );
    const reduceF = (prev: ExDataMap, curr: string) => {
      const sourceData = JSON.parse(res[curr]);
      prev[curr] = {
        ...DATASOURCEMAP[curr],
        ...sourceData,
        assetsNo: Object.keys(sourceData.tokenListMap).length,
      };
      return prev;
    };
    const exDatas = Object.keys(res).reduce(reduceF, {});
    dispatch(setExSourcesData(exDatas));
  };
};
export const setSocialSourcesAsync = () => {
  return async (dispatch: any) => {
    const sourceNameList = Object.keys(DATASOURCEMAP).filter(
      (i) => DATASOURCEMAP[i].type === 'Social'
    );
    const res: DataSourceStorages = await chrome.storage.local.get(
      sourceNameList
    );
    const reduceF = (prev: any, curr: string) => {
      const sourceData = JSON.parse(res[curr]);
      prev[curr] = {
        ...DATASOURCEMAP[curr],
        ...sourceData,
      };
      return prev;
    };
    const datasMap = Object.keys(res).reduce(reduceF, {});
    dispatch(setSocialSourcesAction(datasMap));
  };
};
export const setKYCsAsync = () => {
  return async (dispatch: any) => {
    const sourceNameList = Object.keys(DATASOURCEMAP).filter(
      (i) => DATASOURCEMAP[i].type === 'Identity'
    );
    const res: DataSourceStorages = await chrome.storage.local.get(
      sourceNameList
    );
    const reduceF = (prev: any, curr: string) => {
      const sourceData = JSON.parse(res[curr]);
      prev[curr] = {
        ...DATASOURCEMAP[curr],
        ...sourceData,
      };
      return prev;
    };
    const datasMap = Object.keys(res).reduce(reduceF, {});
    dispatch(setKYCsAction(datasMap));
  };
};

export const setSysConfigAction = (data: object) => ({
  type: SETSYSCONFIG,
  payload: data,
});
export const setOnChainAssetsSourcesAsync = () => {
  return async (dispatch: any) => {
    const { onChainAssetsSources: onChainAssetsSourcesStr } =
      await chrome.storage.local.get(['onChainAssetsSources']);
    const onChainAssetsSourcesObj = onChainAssetsSourcesStr
      ? JSON.parse(onChainAssetsSourcesStr)
      : {};
    dispatch(setOnChainAssetsSources(onChainAssetsSourcesObj));
  };
};
export const setCredentialsAsync = () => {
  return async (dispatch: any) => {
    const { credentials: credentialsStr } = await chrome.storage.local.get([
      'credentials',
    ]);
    const credentialObj = credentialsStr ? JSON.parse(credentialsStr) : {};
    await dispatch(setCredentialsAction(credentialObj));
  };
};

export const setProofTypesAsync = () => {
  return async (dispatch: any) => {
    try {
      const { rc, result } = await getProofTypes();
      if (rc === 0) {
        const filteredTypes = result.filter(
          (i: PROOFTYPEITEM) => i.display === 0
        );
        dispatch(setProofTypesAction(filteredTypes));
      } else {
        // alert('getProofTypes network error');
      }
      const { rc: rc2, result: result2 } = await getProofTypes({
        type: 'web_cred',
      });
      if (rc2 === 0) {
        // let newArr:any[] = []
        // result2.forEach((r:any) => {
        //   const existObj = newArr.find(i => i.name === r.name)
        //   if (!existObj) {
        //     newArr.push(r);
        //   }
        // })
        dispatch(setWebProofTypesAction(result2));
      } else {
        // alert('getProofTypes network error');
      }
    } catch (e) {
      // alert('getProofTypes network error');
    }
  };
};
