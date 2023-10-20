import type { AssetsMap } from '@/components/DataSourceOverview/DataSourceList/DataSourceItem';
import { DATASOURCEMAP } from '@/config/constants';
import type { ExchangeMeta } from '@/types/dataSource';
import type { DataSourceStorages } from '@/pages/DataSourceOverview';
import { getProofTypes } from '@/services/api/config';
import type { PROOFTYPEITEM } from '@/types/cred';
import { connectWallet, requestSign } from '@/services/wallets/metamask';
import { DEFAULTDATASOURCEPOLLINGTIMENUM } from '@/config/constants';
import {
  bindConnectedWallet,
  checkIfBindConnectedWallet,
} from '@/services/api/user';

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
;
export const setRewardsDialogVisibleAction = (values: any) => ({
  type: 'setRewardsDialogVisibleAction',
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
  connectObj?:any,
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
        address = connectObj.address
        provider = connectObj.provider;
      } else {
        const connectRes = await connectWallet(network);
        provider = connectRes[2]
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
          startFn && startFn();
          sucFn && sucFn({ name: type, address, provider });
        } else {
          return;
        }
      } else {
        startFn && startFn();
        await dispatch(setConnectWalletDialogVisibleAction(true));
        const timestamp: string = +new Date() + '';
        const signature = await requestSign(address, timestamp);
        if (!signature) {
          errorFn && errorFn();
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
          sucFn && sucFn({ name: type, address, provider });
        }
      }
    } catch (e) {
      console.log('connectWalletAsync catch e=', e);
      errorFn && errorFn();
    }
  };
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
    const { keyStore } = await chrome.storage.local.get(['keyStore']);
    if (keyStore) {
      const { address } = JSON.parse(keyStore);
      dispatch(setWalletAddressAction('0x' + address));
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
    dispatch(setCredentialsAction(credentialObj));
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
        dispatch(setWebProofTypesAction(result2));
      } else {
        // alert('getProofTypes network error');
      }
    } catch (e) {
      // alert('getProofTypes network error');
    }
  };
};
