import { sub, getStatisticalData, getCurrentDate } from '@/utils/utils';
import { connectWallet, requestSign } from '@/services/wallets/metamask';
import {
  bindConnectedWallet,
  checkIfBindConnectedWallet,
} from '@/services/api/user';
import { queryBadgeEventPeriod, queryEventDetail } from '@/services/api/event';
import { checkEarlyBirdNFT } from '@/services/api/event';
import { checkLotteryResults } from '@/services/api/event';
import { getOnChainNFTs } from '@/services/api/dataDashboard';
import {
  getAssetsOnChains,
  sendRequestAssetsOnChains,
  requestAssetsOnChains,
} from '@/services/api/dataSource';
import { eventReport } from '@/services/api/usertracker';
import { getProofTypes } from '@/services/api/config';
import { getEARLYBIRDNFT } from '@/services/chains/erc721';
import { DATASOURCEMAP } from '@/config/dataSource';
import { DEFAULTDATASOURCEPOLLINGTIMENUM } from '@/config/constants';

import {
  SCROLLEVENTNAME,
  BASEVENTNAME,
  LINEAEVENTNAME,
  LUCKYDRAWEVENTNAME,
  ETHSIGNEVENTNAME,
  EARLYBIRDNFTEVENTNAME,
} from '@/config/events';
import { WALLETMAP } from '@/config/wallet';
import { CLAIMNFTNETWORKNAME } from '@/config/chain';
import { OPENSEALINK } from '@/config/envConstants';

import type { ExchangeMeta } from '@/types/dataSource';
import type { DataSourceStorages } from '@/pages/DataSourceOverview';
import type { PROOFTYPEITEM } from '@/types/cred';
import type { AssetsMap } from '@/components/DataSourceOverview/DataSourceList/DataSourceItem';
import iconOpenSea from '@/assets/img/events/iconOpenSea.svg';

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
export const setSourceUpdateInfoAction = (values: any) => ({
  type: 'setSourceUpdateInfo',
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
export const setConnectWalletDialogVisibleAction = (values: any) => ({
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

export const setEventsAction = (values: any) => ({
  type: 'setEventsAction',
  payload: values,
});
export const setThemeAction = (values: string) => ({
  type: 'setThemeAction',
  payload: values,
});
export const setConnectByAPILoading = (values: number) => ({
  type: 'setConnectByAPILoading',
  payload: values,
});
export const setIfHasPwdAction = (values: any) => ({
  type: 'setIfHasPwd',
  payload: values,
});
export const setConnectedWalletsAction = (values: any) => ({
  type: 'setConnectedWallets',
  payload: values,
});
export const setAttestLoading = (values: number) => ({
  type: 'setAttestLoading',
  payload: values,
});
export const setActiveAttestation = (values: any) => ({
  type: 'setActiveAttestation',
  payload: values,
});
export const setActiveOnChain = (values: any) => ({
  type: 'setActiveOnChain',
  payload: values,
});
export const setActiveConnectWallet = (values: any) => ({
  type: 'setActiveConnectWallet',
  payload: values,
});
export const setMsgs = (values: any) => ({
  type: 'setMsgs',
  payload: values,
});
export const setActiveConnectDataSource = (values: any) => ({
  type: 'setActiveConnectDataSource',
  payload: values,
});
export const setNfts = (values: any) => ({
  type: 'setNfts',
  payload: values,
});
export const setEarlyBirdNFTs = (values: any) => ({
  type: 'setEarlyBirdNFTs',
  payload: values,
});
export const setEventsLotteryResults = (values: any) => ({
  type: 'setEventsLotteryResults',
  payload: values,
});
export const setConnectedWalletsActionAsync = () => {
  return async (dispatch: any) => {
    const { connectedWallets: lastConnectedWalletsStr } =
      await chrome.storage.local.get(['connectedWallets']);
    let lastConnectedWalletsObj = {};
    if (lastConnectedWalletsStr) {
      lastConnectedWalletsObj = JSON.parse(lastConnectedWalletsStr);
    }
    await dispatch(setConnectedWalletsAction(lastConnectedWalletsObj));
  };
};
export const setMsgsAsync = (values) => {
  return async (dispatch: any) => {
    await chrome.storage.local.set({ msgs: JSON.stringify(values) });
    await dispatch(setMsgs(values));
  };
};

export const setConnectWalletActionAsync = (values: any) => {
  return async (dispatch: any) => {
    if (values?.address) {
      const { address, name, id } = values;
      await chrome.storage.local.set({
        connectedWalletAddress: JSON.stringify({
          name,
          address,
          id,
        }),
      });
      const { connectedWallets: lastConnectedWalletsStr } =
        await chrome.storage.local.get(['connectedWallets']);
      let lastConnectedWalletsObj = {};
      let lastCurrentWalletObj = {};
      if (lastConnectedWalletsStr) {
        lastConnectedWalletsObj = JSON.parse(lastConnectedWalletsStr);
        if (lastConnectedWalletsObj[id]) {
          lastCurrentWalletObj = lastConnectedWalletsObj[id];
        }
      }
      lastCurrentWalletObj[address.toLowerCase()] = { name, address, id };
      lastConnectedWalletsObj[id] = lastCurrentWalletObj;

      await chrome.storage.local.set({
        connectedWallets: JSON.stringify(lastConnectedWalletsObj),
      });

      await dispatch(setConnectedWalletsActionAsync());
      await dispatch(setConnectWalletAction(values));
      await dispatch(setConnectWalletDialogVisibleAction(0));
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
  network?: any,
  label?: string
) => {
  return async (dispatch: any, getState) => {
    console.log('getState', getState()); // delete
    const requireFetchAssets = getState().requireFetchAssets;
    let activeNetworkId = getState().activeConnectWallet.network;
    // let activeNetwork = EASInfo[activeNetworkId as keyof typeof EASInfo]

    try {
      let address;
      let provider;
      startFn && (await startFn());
      if (connectObj?.address) {
        address = connectObj.address;
        provider = connectObj.provider;
      } else {
        let connectRes;
        if (network?.title === 'BNB Greenfield') {
          connectRes = await connectWallet();
        } else {
          connectRes = await connectWallet(network);
        }
        console.log('222metamask connect successfully');
        provider = connectRes[2];
        address = (connectRes[0] as string[])[0];
      }
      const type = connectObj?.id ?? 'metamask';
      const walletName = WALLETMAP[type].name;
      const walletInfo =
        type === 'walletconnect'
          ? {
              walletName,
              walletProvider: connectObj.provider,
            }
          : undefined;
      const checkRes = await checkIfBindConnectedWallet({ address });

      if (checkRes.rc === 0) {
        console.log(
          '222metamask connect successfully checkIfBindConnectedWallet',
          checkRes.result
        );
      }
      if (checkRes.rc === 0 && checkRes.result) {
        if (requireFetchAssets) {
          const timestamp: string = +new Date() + '';
          const signature = await requestSign(address, timestamp, walletInfo);
          if (!signature) {
            errorFn && (await errorFn());
            return;
          }
          try {
            await getChainAssets({
              signature,
              timestamp,
              address,
              dispatch,
              label,
              requireReport: false,
            });
            dispatch(setNftsActionAsync([{ signature, timestamp, address }]));
          } catch {}
        }
        await dispatch(
          setConnectWalletActionAsync({
            id: type,
            name: walletName,
            address,
            provider,
          })
        );
        await dispatch(setConnectWalletDialogVisibleAction(0));
        await dispatch(
          setActiveConnectDataSource({
            loading: 2,
          })
        );
        if (sucFn) {
          sucFn && (await sucFn({ id: type, name: type, address, provider }));
        } else {
          return;
        }
      } else {
        // startFn && (await startFn());
        //await dispatch(setConnectWalletDialogVisibleAction(1));
        const timestamp: string = +new Date() + '';
        const signature = await requestSign(address, timestamp, walletInfo);
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
        if (rc === 0) {
          console.log(
            '222metamask connect successfully bindConnectedWallet',
            result
          );
        }
        if (rc === 0 && result) {
          await dispatch(
            setConnectWalletActionAsync({
              id: type,
              name: walletName,
              address,
              provider,
            })
          );
          await dispatch(setConnectWalletDialogVisibleAction(0));
          try {
            await getChainAssets({
              signature,
              timestamp,
              address,
              dispatch,
              label,
            });
            dispatch(setNftsActionAsync([{ signature, timestamp, address }]));
          } catch {}

          await dispatch(
            setActiveConnectDataSource({
              loading: 2,
            })
          );
          sucFn &&
            (await sucFn({
              name: type,
              address,
              provider,
              signature,
              timestamp,
            }));
        }
      }
    } catch (e) {
      console.log('connectWalletAsync catch e=', e);
      errorFn && errorFn();
      await dispatch(
        setActiveConnectDataSource({
          loading: 3,
        })
      );
    }
  };
};
const storeOnChainAssets = async ({
  curConnectedAddr,
  label,
  timestamp,
  signature,
  rawData,
  dispatch,
  requireUpdate,
}: any) => {
  const res = getStatisticalData(rawData ?? {});
  const curAccOnChainAssetsItem: any = {
    address: curConnectedAddr,
    label: label || '',
    date: getCurrentDate(),
    timestamp,
    signature,
    ...res,
    ...DATASOURCEMAP['onChain'],
    walletName: 'MetaMask', // TODO-newui
    updateTime: Date.now() + '',
  };

  const { onChainAssetsSources: lastOnChainAssetsMapStr } =
    await chrome.storage.local.get(['onChainAssetsSources']);

  const lastOnChainAssetsMap = lastOnChainAssetsMapStr
    ? JSON.parse(lastOnChainAssetsMapStr)
    : {};
  if (curConnectedAddr in lastOnChainAssetsMap && requireUpdate) {
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
};
export const getChainAssets = async ({
  signature,
  timestamp,
  address: curConnectedAddr,
  dispatch,
  label,
  requireReport = true,
}) => {
  try {
    if (requireReport) {
      await storeOnChainAssets({
        curConnectedAddr,
        label,
        timestamp,
        signature,
        rawData: { nativeToken: [], erc20Token: {} },
        dispatch,
        requireUpdate: false,
      });
    }
    const { rc, result, msg } = await sendRequestAssetsOnChains({
      signature,
      timestamp,
      address: curConnectedAddr,
      type: 'TOKEN',
    });
    if (rc === 0 && result) {
      if (requireReport) {
        const eventInfo = {
          eventType: 'DATA_SOURCE_INIT',
          rawData: {
            type: 'Assets',
            dataSource: 'onchain-ConnectWallet',
          },
        };
        eventReport(eventInfo);
      }
      const pollingFn = async () => {
        try {
          const { rc: requestRc, result: requestRes } =
            await requestAssetsOnChains({
              type: 'TOKEN',
              address: curConnectedAddr,
            });
          if (requestRc === 0) {
            if (requestRes.status === 'SUCCESS') {
              clearInterval(pollingTimer);
            }
            if (
              requestRes?.data?.erc20Token &&
              requestRes?.data?.nativeToken?.length > 0
            ) {
              await storeOnChainAssets({
                curConnectedAddr,
                label,
                timestamp,
                signature,
                rawData: requestRes.data,
                dispatch,
                requireUpdate: true,
              });
            }
          }
        } catch (err) {
          console.log('getChainAssetsResult catch err=', err);
        }
      };
      let pollingTimer = setInterval(pollingFn, 5000);
    }
  } catch (e) {
    console.log('getChainAssets catch e=', e);
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
export const setEventsActionAsync = () => {
  return async (dispatch: any) => {
    try {
      const eventNameArr = [
        LUCKYDRAWEVENTNAME,
        SCROLLEVENTNAME,
        LINEAEVENTNAME,
        BASEVENTNAME,
        ETHSIGNEVENTNAME,
      ];
      const requestArr = eventNameArr.map((r) => {
        return queryEventDetail({
          event: r,
        });
      });
      const resArr = await Promise.all(requestArr);
      const obj = resArr.reduce((prev, curr, currK) => {
        const { rc, result } = curr;
        if (rc === 0) {
          prev[eventNameArr[currK]] = result;
        }
        return prev;
      }, {});
      await chrome.storage.local.set({
        eventsDetail: JSON.stringify(obj),
      });
      dispatch(setEventsAction(obj));
    } catch (e) {
      console.log('setEventsActionAsync e:', e);
    }
  };
};
export const initEventsActionAsync = () => {
  return async (dispatch: any) => {
    const { eventsDetail: eventsDetailStr } = await chrome.storage.local.get([
      'eventsDetail',
    ]);
    if (eventsDetailStr) {
      const eventsDetailObj = JSON.parse(eventsDetailStr);
      await dispatch(setEventsAction(eventsDetailObj));
    }
    await dispatch(setEventsActionAsync());
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
        ...sourceData,
        ...DATASOURCEMAP[curr],
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

// const checkIfHadSetPwd = useCallback(async () => {
//   let { keyStore } = await chrome.storage.local.get(['keyStore']);
//   dispatch()
// }, [dispatch]);
export const initIfHadPwdAsync = () => {
  return async (dispatch: any) => {
    let { keyStore } = await chrome.storage.local.get(['keyStore']);
    dispatch(setIfHasPwdAction(!!keyStore));
  };
};

export const getChainAssetsNFT = async ({
  signature,
  timestamp,
  address: curConnectedAddr,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { rc, result, msg } = await sendRequestAssetsOnChains({
        signature,
        timestamp,
        address: curConnectedAddr,
        type: 'NFT',
      });
      if (rc === 0 && result) {
        const pollingFn = async () => {
          try {
            const { rc: requestRc, result: requestRes } =
              await requestAssetsOnChains({
                type: 'NFT',
                address: curConnectedAddr,
              });
            if (requestRc === 0 && requestRes.status === 'SUCCESS') {
              clearInterval(pollingTimer);
              // mock data  delete
              // if (
              //   curConnectedAddr.toLowerCase() ===
              //   '0xd7cf78d33ce4c8a70529dc379582b290e1bea1c1'
              // ) {
              //   requestRes.data = {
              //     'Arbitrum One': [
              //       {
              //         contractAddress:
              //           '0xaf1cf02378db203ea9545d62588567c61b1ed7f8', //nft合约地址
              //         transactionHash:
              //           '0x98a7e58a68e687d1b598f0ce36000b7490a7799345362bfef6a2cb8fb0f3abd6', //transfer hash
              //         tokenId: '204', //tokeniD
              //         name: 'Vision Emissary A', //nft name
              //         collectionName: 'Uniswap V3 Positions NFT-V1', //collection name
              //         imageUri:
              //           'https://s3.ap-northeast-1.amazonaws.com/quest3.xyz/quest/831879261192478866.gif', //nft 图片地址
              //         ercType: 'erc721', //nft 类型
              //         chain: 'Arbitrum One', //链
              //         mintTime: '1698720422000', //mint time
              //       },
              //     ],
              //     Polygon: [
              //       {
              //         contractAddress:
              //           '0xcc3feb3a247f288799e9ec52772f7a67a85559ce',
              //         transactionHash:
              //           '0xa4468bd679c39c7b439f6dd0f2735829f090f9997ebe594a36667c78dd516d1b',
              //         tokenId: '1',
              //         name: 'Airdrop at 3eth.top 🎁',
              //         collectionName: 'Uniswap V3 Positions NFT-V1', //collection name
              //         imageUri:
              //           'ipfs://bafybeiepa5aouj66wsnd4lter3euxicxkoy47ljkrjfvupc5b27gqfnkfm/eth.jpg',
              //         ercType: 'erc1155',
              //         chain: 'Polygon',
              //         mintTime: '1710913406000',
              //       },
              //     ],
              //   };
              // }
              // if (
              //   curConnectedAddr.toLowerCase() ===
              //   '0x53F7a6ab7b8E6Fcfda90C543a05d635867dF0E72'.toLowerCase()
              // ) {
              //   requestRes.data = {
              //     BSC: [
              //       {
              //         contractAddress:
              //           '0xaf1cf02378db203ea9545d62588567c61b1ed7f8', //nft合约地址
              //         transactionHash:
              //           '0x98a7e58a68e687d1b598f0ce36000b7490a7799345362bfef6a2cb8fb0f3abd6', //transfer hash
              //         tokenId: '204', //tokeniD
              //         name: 'Vision Emissary A', //nft name
              //         collectionName: 'Uniswap V3 Positions NFT-V1', //collection name
              //         imageUri:
              //           'https://s3.ap-northeast-1.amazonaws.com/quest3.xyz/quest/831879261192478866.gif', //nft 图片地址
              //         ercType: 'erc721', //nft 类型
              //         chain: 'Arbitrum One', //链
              //         mintTime: '1698720422000', //mint time
              //       },
              //     ],
              //     Polygon: [
              //       {
              //         contractAddress:
              //           '0xcc3feb3a247f288799e9ec52772f7a67a85559ce',
              //         transactionHash:
              //           '0xa4468bd679c39c7b439f6dd0f2735829f090f9997ebe594a36667c78dd516d1b',
              //         tokenId: '1',
              //         name: 'Airdrop at 3eth.top 🎁',
              //         collectionName: 'Uniswap V3 Positions NFT-V1', //collection name
              //         imageUri:
              //           'ipfs://bafybeiepa5aouj66wsnd4lter3euxicxkoy47ljkrjfvupc5b27gqfnkfm/eth.jpg',
              //         ercType: 'erc1155',
              //         chain: 'Polygon',
              //         mintTime: '1710913406000',
              //       },
              //       {
              //         contractAddress:
              //           '0xcc3feb3a247f288799e9ec52772f7a67a85559ce',
              //         transactionHash:
              //           '0xa4468bd679c39c7b439f6dd0f2735829f090f9997ebe594a36667c78dd516d1b',
              //         tokenId: '1',
              //         name: 'Airdrop at 3eth.top 🎁',
              //         collectionName: 'Uniswap V3 Positions NFT-V1', //collection name
              //         imageUri:
              //           'ipfs://bafybeiepa5aouj66wsnd4lter3euxicxkoy47ljkrjfvupc5b27gqfnkfm/eth.jpg',
              //         ercType: 'erc1155',
              //         chain: 'Polygon',
              //         mintTime: '1710913406000',
              //       },
              //       {
              //         contractAddress:
              //           '0xcc3feb3a247f288799e9ec52772f7a67a85559ce',
              //         transactionHash:
              //           '0xa4468bd679c39c7b439f6dd0f2735829f090f9997ebe594a36667c78dd516d1b',
              //         tokenId: '1',
              //         name: 'Airdrop at 3eth.top 🎁',
              //         collectionName: 'Uniswap V3 Positions NFT-V1', //collection name
              //         imageUri:
              //           'ipfs://bafybeiepa5aouj66wsnd4lter3euxicxkoy47ljkrjfvupc5b27gqfnkfm/eth.jpg',
              //         ercType: 'erc1155',
              //         chain: 'Polygon',
              //         mintTime: '1710913406000',
              //       },
              //       {
              //         contractAddress:
              //           '0xcc3feb3a247f288799e9ec52772f7a67a85559ce',
              //         transactionHash:
              //           '0xa4468bd679c39c7b439f6dd0f2735829f090f9997ebe594a36667c78dd516d1b',
              //         tokenId: '1',
              //         name: 'Airdrop at 3eth.top 🎁',
              //         collectionName: 'Uniswap V3 Positions NFT-V1', //collection name
              //         imageUri:
              //           'ipfs://bafybeiepa5aouj66wsnd4lter3euxicxkoy47ljkrjfvupc5b27gqfnkfm/eth.jpg',
              //         ercType: 'erc1155',
              //         chain: 'Polygon',
              //         mintTime: '1710913406000',
              //       },
              //       {
              //         contractAddress:
              //           '0xcc3feb3a247f288799e9ec52772f7a67a85559ce',
              //         transactionHash:
              //           '0xa4468bd679c39c7b439f6dd0f2735829f090f9997ebe594a36667c78dd516d1b',
              //         tokenId: '1',
              //         name: 'Airdrop at 3eth.top 🎁',
              //         collectionName: 'Uniswap V3 Positions NFT-V1', //collection name
              //         imageUri:
              //           'ipfs://bafybeiepa5aouj66wsnd4lter3euxicxkoy47ljkrjfvupc5b27gqfnkfm/eth.jpg',
              //         ercType: 'erc1155',
              //         chain: 'Polygon',
              //         mintTime: '1710913406000',
              //       },
              //       {
              //         contractAddress:
              //           '0xcc3feb3a247f288799e9ec52772f7a67a85559ce',
              //         transactionHash:
              //           '0xa4468bd679c39c7b439f6dd0f2735829f090f9997ebe594a36667c78dd516d1b',
              //         tokenId: '1',
              //         name: 'Airdrop at 3eth.top 🎁',
              //         collectionName: 'Uniswap V3 Positions NFT-V1', //collection name
              //         imageUri:
              //           'ipfs://bafybeiepa5aouj66wsnd4lter3euxicxkoy47ljkrjfvupc5b27gqfnkfm/eth.jpg',
              //         ercType: 'erc1155',
              //         chain: 'Polygon',
              //         mintTime: '1710913406000',
              //       },
              //     ],
              //   };
              // }
              return resolve(requestRes.data);
            }
          } catch (err) {
            console.log('getChainAssetsResult catch err=', err);
          }
        };
        let pollingTimer = setInterval(pollingFn, 3000);
      }
    } catch (e) {
      reject(e);
      console.log('getChainAssets catch e=', e);
    }
  });
};
export const initNftsActionAsync = () => {
  return async (dispatch: any) => {
    try {
      const { nfts: nftsStr } = await chrome.storage.local.get(['nfts']);
      const nftsObj = nftsStr ? JSON.parse(nftsStr) : {};
      dispatch(setNfts(nftsObj));
    } catch (e) {
      console.log('setEventsActionAsync e:', e);
    }
  };
};
export const setNftsActionAsync: (arr?: any[]) => void = (walletArr) => {
  return async (dispatch: any, getState) => {
    try {
      const onChainAssetsSources = getState().onChainAssetsSources;
      let connectedWalletAddressesArr = Object.keys(onChainAssetsSources);
      let rawArr = Object.values(onChainAssetsSources);
      if (walletArr) {
        connectedWalletAddressesArr = walletArr.map((i) => i.address);
        rawArr = walletArr;
      }

      const requestArr = rawArr.map(async (r: any) => {
        const { address, signature, timestamp } = r;
        return await getChainAssetsNFT({
          address,
          signature,
          timestamp,
        });
      });
      const resArr = await Promise.all(requestArr);
      const { nfts: nftsStr } = await chrome.storage.local.get(['nfts']);
      const nftsObj = nftsStr ? JSON.parse(nftsStr) : {};
      resArr.reduce((prev: any, curr, currK) => {
        const addr = connectedWalletAddressesArr[currK];
        prev[addr] = curr;
        nftsObj[addr] = curr;
        return prev;
      }, {});

      await chrome.storage.local.set({
        nfts: JSON.stringify(nftsObj),
      });
      dispatch(setNfts(nftsObj));
    } catch (e) {
      console.log('setEventsActionAsync e:', e);
    }
  };
};

// export const setEarlyBirdNFTAsync = () => {
//   return async (dispatch: any, getState) => {
//     try {
//       const { rc, result } = await checkEarlyBirdNFT();
//       if (rc === 0 && result) {
//         const requestArr = Object.keys(result).map(async (addr: any) => {
//           return await getEARLYBIRDNFT({
//             networkName: CLAIMNFTNETWORKNAME,
//             tokenId: Number(result[addr]),
//           });
//         });
//         const nftsInfoArr = await Promise.all(requestArr);
//         let obj: any = {};
//         nftsInfoArr.forEach((i, k) => {
//           const addr = Object.keys(result)[k];
//           obj[addr] = { ...i, address: addr };
//         });
//         dispatch(setEarlyBirdNFTs(obj));
//       }
//     } catch (e) {
//       console.log('setEarlyBirdNFTAsync e:', e);
//     }
//   };
// };

// export const setEventsLotteryResultsAsync = () => {
//   return async (dispatch: any) => {
//     try {
//       const eventNameArr = [LUCKYDRAWEVENTNAME, SCROLLEVENTNAME];
//       const requestArr = eventNameArr.map((r) => {
//         return checkLotteryResults({
//           event: r,
//         });
//       });
//       const resArr = await Promise.all(requestArr);
//       const obj = resArr.reduce((prev, curr, currK) => {
//         const { rc, result } = curr;
//         if (rc === 0) {
//           prev[eventNameArr[currK]] = result;
//         }
//         return prev;
//       }, {});
//       dispatch(setEventsLotteryResults(obj));
//     } catch (e) {
//       console.log('fetchLotteryResults catch e=', e);
//     }
//   };
// };

export const initSetThemeAction = () => {
  return (dispatch: any) => {
    const lastColorTheme = localStorage.getItem('colorTheme');
    if (lastColorTheme) {
      dispatch(setThemeAction(lastColorTheme));
    }
  };
};

export const setNewRewards = (values: any) => ({
  type: 'setNewRewards',
  payload: values,
});
export const initSetNewRewardsAction = () => {
  return async (dispatch: any) => {
    try {
      const { newRewards } = await chrome.storage.local.get(['newRewards']);
      if (newRewards) {
        dispatch(setNewRewards(JSON.parse(newRewards)));
      }

      let newRewardsObj: any = {};
      // handle scroll & lucky draw
      // check lottery result  action:setEventsLotteryResultsAsync;
      const eventNameArr = [LUCKYDRAWEVENTNAME, SCROLLEVENTNAME];
      const requestArr = eventNameArr.map((r) => {
        return checkLotteryResults({
          event: r,
        });
      });
      const resArr = await Promise.all(requestArr);
      const lotteryResultObj = resArr.reduce((prev, curr, currK) => {
        const { rc, result } = curr;
        if (rc === 0) {
          prev[eventNameArr[currK]] = result;
        }
        return prev;
      }, {});
      dispatch(setEventsLotteryResults(lotteryResultObj));
      const fn = (eName) => {
        const extraInfoObj = {
          [LUCKYDRAWEVENTNAME]: {
            title: '1st Commemorative Badge',
            desc: 'PADO event badge',
          },
          [SCROLLEVENTNAME]: {
            title: 'Scroll zkAttestation Medal',
            desc: 'PADO event badge',
          },
        };
        if (lotteryResultObj[eName]) {
          const { result, iconUrl } = lotteryResultObj[eName];
          if (result) {
            const { title, desc } = extraInfoObj[eName];
            newRewardsObj[eName] = {
              [eName]: {
                id: eName,
                img: iconUrl,
                title,
                desc,
              },
            };
          }
        }
      };
      fn(LUCKYDRAWEVENTNAME);
      fn(SCROLLEVENTNAME);

      // handle early bird nft
      // action: setEarlyBirdNFTAsync
      const { rc, result } = await checkEarlyBirdNFT();
      if (rc === 0 && result) {
        const requestArr = Object.keys(result).map(async (addr: any) => {
          return await getEARLYBIRDNFT({
            networkName: CLAIMNFTNETWORKNAME,
            tokenId: Number(result[addr]),
          });
        });
        const nftsInfoArr = await Promise.all(requestArr);
        let earlyBirdNFTObj: any = {};
        nftsInfoArr.forEach((i, k) => {
          const addr = Object.keys(result)[k];
          const tokenId = result[addr];
          earlyBirdNFTObj[addr] = {
            ...i,
            address: addr,
            title: i.name,
            desc: i.description,
            img: i.image,
            linkIcon: iconOpenSea,
            link: `${OPENSEALINK}/${tokenId}`,
          };
        });
        newRewardsObj[EARLYBIRDNFTEVENTNAME] = earlyBirdNFTObj;
        dispatch(setEarlyBirdNFTs(earlyBirdNFTObj));
      }

      // handle brevis
      // action: initRewardsActionAsync
      const { rewards } = await chrome.storage.local.get(['rewards']);
      if (rewards) {
        const rewardsObj = JSON.parse(rewards);
        dispatch(setRewardsAction(rewardsObj));
        const joinedBrevisRewardList = Object.values(rewardsObj).filter(
          (r: any) => r?.event === 'brevis' && r.type === 'NFT'
        );
        let brevisNFTsObj = {};
        joinedBrevisRewardList.forEach((i: any) => {
          const { image, title, name } = i;
          const brevisId = 'brevis-' + Date.now();
          brevisNFTsObj[brevisId] = {
            id: brevisId,
            img: image,
            title,
            desc: name,
          };
        });
        newRewardsObj['brevis'] = brevisNFTsObj;
      }
      chrome.storage.local.set({ newRewards: JSON.stringify(newRewardsObj) });
      dispatch(setNewRewards(newRewardsObj));
    } catch (e) {
      console.log('initSetNewRewardsAction catch e=', e);
    }
  };
};
