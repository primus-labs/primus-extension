import BigNumber from 'bignumber.js';
import numeral from 'numeral';
import { PADOSERVERURL } from '@/config/envConstants';
import { BIGZERO } from '@/config/constants';
import type { AssetsMap } from '@/types/dataSource';

var ethereumjsUtil = require('ethereumjs-util');

export function gt(a: number, b: number) {
  return new BigNumber(a).gt(new BigNumber(b));
}
export function gte(a: number, b: number) {
  return new BigNumber(a).gte(new BigNumber(b));
}
export function lt(a: number, b: number) {
  return new BigNumber(a).lt(new BigNumber(b));
}
export function lte(a: number, b: number) {
  return new BigNumber(a).lte(new BigNumber(b));
}
export function add(a: number, b: number) {
  return new BigNumber(a).plus(new BigNumber(b));
}
export function sub(a: number, b: number) {
  return new BigNumber(a).minus(new BigNumber(b));
}
export function mul(a: number, b: number) {
  return new BigNumber(a).times(new BigNumber(b));
}
export function div(a: number, b: number) {
  return new BigNumber(a).div(new BigNumber(b));
}

type FormatAddressType = (
  str: string,
  startNum?: number,
  endNum?: number,
  sepStr?: string
) => string;
export const formatAddress: FormatAddressType = function (
  str,
  startNum = 7,
  endNum = 5,
  sepStr = '...'
) {
  const endIdx = -1 * endNum;
  const startS = str.substr(0, startNum);
  const endS = str.substr(endIdx);
  return `${startS}${sepStr}${endS}`;
};

// TODO nouse
export function getMutipleStorageSyncData(storageKeys: string[]): object {
  // Immediately return a promise and start asynchronous work
  return new Promise((resolve, reject) => {
    // Asynchronously fetch all data from storage.sync.
    chrome.storage.local.get(storageKeys, (items) => {
      // Pass any observed errors down the promise chain.
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      // Pass the data retrieved from storage down the promise chain.
      resolve(items);
    });
  });
}

// TODO nouse
export function getSingleStorageSyncData(storageKey: string) {
  // Immediately return a promise and start asynchronous work
  return new Promise((resolve, reject) => {
    // Asynchronously fetch all data from storage.sync.
    chrome.storage.local.get(storageKey, (items) => {
      // Pass any observed errors down the promise chain.
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      // Pass the data retrieved from storage down the promise chain.
      resolve(items[storageKey]);
    });
  });
}

// "Jun 15, 2023"
// transform date from timestamp to string such as 12 Mar, 2023
export function formatDate(timestamp: number, separator = ',') {
  var date = new Date(timestamp),
    Y = date.getFullYear(),
    M = date.toLocaleString('en', { month: 'short' }),
    D = (date.getDate() + '').padStart(2, '0');
  return `${M} ${D}${separator} ${Y}`;
}

// "10:29:00"
export function formatTime(timestamp: number) {
  var date = new Date(timestamp),
    h = (date.getHours() + '').padStart(2, '0'),
    m = (date.getMinutes() + '').padStart(2, '0'),
    s = (date.getSeconds() + '').padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// "2023/06/21 10:29"
export function formatFullTime(timestamp: number) {
  var date = new Date(timestamp),
    Y = date.getFullYear(),
    M = (date.getMonth() + '').padStart(2, '0'),
    D = (date.getDate() + '').padStart(2, '0'),
    h = (date.getHours() + '').padStart(2, '0'),
    m = (date.getMinutes() + '').padStart(2, '0');
  return `${Y}/${M}/${D} ${h}:${m}`;
}

export function getCurrentDate(timestamp?: any, separator = ',') {
  const time = timestamp ? +new Date(timestamp) : +new Date();
  return formatDate(time, separator);
}

//format deciamls
export function formatD(totalBalance: string, decimal: number = 2) {
  return totalBalance ? `${new BigNumber(totalBalance).toFixed(decimal)}` : '-';
}
//format unit & deciamls
export function formatUD(totalBalance: string) {
  return `$${formatD(totalBalance)}`;
}
type NumeralParams = {
  decimalPlaces?: number;
  withThousandSepartor?: boolean;
  transferUnit?: boolean;
  transferUnitThreshold?: number;
};
export function formatNumeral(num: string | number, params?: NumeralParams) {
  const {
    decimalPlaces = 2,
    withThousandSepartor = true,
    transferUnit = false,
    transferUnitThreshold = 0,
  } = params ?? {
    decimalPlaces: 2,
    withThousandSepartor: true,
    transferUnit: false,
    transferUnitThreshold: 0,
  };
  num = new BigNumber(num).toFixed(6); // fix: < 0.0000001 numeral error
  let formatReg = '0';
  if (withThousandSepartor) {
    formatReg = '0,0';
  }
  if (decimalPlaces) {
    if (
      !transferUnitThreshold ||
      (transferUnitThreshold && new BigNumber(num).gte(transferUnitThreshold))
    ) {
      formatReg += `.${'0'.repeat(decimalPlaces)}`;
    }
  }
  if (transferUnit) {
    if (new BigNumber(num).gte(transferUnitThreshold)) {
      formatReg += `a`;
    }
  }
  return numeral(num).format(formatReg).toUpperCase();
}

export function postMsg(port: chrome.runtime.Port, msg: any) {
  try {
    console.log('postMsg port: ', port, 'msg:', msg);
    port.postMessage(msg);
  } catch (error: any) {
    console.log('postMsg error: ', error);
    // throw new Error(error);
  }
}

export function strToHex(str: string) {
  const value = Buffer.from(str, 'utf-8');
  const returnValue = ethereumjsUtil.bufferToHex(
    ethereumjsUtil.keccak256(value)
  );
  return returnValue;
}
export function strToHexSha256(str: string) {
  const value = Buffer.from(str, 'utf-8');
  const returnValue = ethereumjsUtil.bufferToHex(ethereumjsUtil.sha256(value));
  return returnValue;
}
export function base64ToHex(base64Str: string) {
  const value = Buffer.from(base64Str, 'base64');
  const returnValue = '0x' + value.toString();
  return returnValue;
}

type AuthParams = {
  source: string;
  state: string;
  token: string;
};
export function getAuthUrl(authParams: AuthParams) {
  const { source, state, token } = authParams;
  return `${PADOSERVERURL}/oauth2/render/${source}?state=${state}&pado-token=${token}`;
}

export async function assembleUserInfoParams() {
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
export async function getAuthUserIdHash() {
  const { userInfo } = await chrome.storage.local.get(['userInfo']);
  const { id: authUserId } = JSON.parse(userInfo);
  const authUseridHash = strToHex(authUserId);
  return authUseridHash;
}
type ThrottleFn = () => void;
export function throttle(fn: ThrottleFn, delay: number) {
  let timer: any = null;
  return () => {
    if (!timer) {
      timer = setTimeout(() => {
        fn();
        timer = null;
      }, delay);
    }
  };
}
export function debounce(fn: ThrottleFn, delay: number) {
  let timer: any = null;
  return () => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(fn, delay);
  };
}

export const getStatisticalData = (res: any) => {
  const { nativeToken, erc20Token } = res;
  const tokenMap: any = {};
  let totalBalance: any = 0;
  const chainsAssetsMapReduceF: (
    prevChainsAssetMap: any,
    curChainName: string
  ) => any = (prevChainsAssetMap, curChainName) => {
    const curChainAssetArr =
      erc20Token[curChainName as keyof typeof erc20Token] ?? [];

    // erc20 token
    let curChainTotalBalance: any = new BigNumber(0);
    const curChainAssetMapReduceF = (prev: any, currTokenInfo: any) => {
      const {
        balance,
        contractAddress,
        currentUsdPrice,
        decimals,
        symbol,
        logos,
      } = currTokenInfo;

      const amount = div(parseInt(balance), Math.pow(10, decimals));
      const amtNum = amount.toNumber();
      const price = currentUsdPrice ?? 0;
      if (gt(amtNum, 0) && gt(price, 0)) {
        const rawValue = mul(amtNum, price);
        if (gt(rawValue.toNumber(), 0.01)) {
          const value = rawValue.toFixed();
          const logo = logos[0]?.uri; // TODO default img
          const assetAddrASymbol = `${symbol}---${contractAddress}`;
          const tokenInfoObj = {
            symbol: assetAddrASymbol,
            amount: amount.toFixed(),
            price,
            value,
            logo,
            address: contractAddress,
            chain: curChainName,
          };

          if (assetAddrASymbol in tokenMap) {
            const { amount: lastAmt } = tokenMap[assetAddrASymbol];
            const newAmt = add(lastAmt.toNumber(), amtNum);
            const newValue = mul(newAmt.toNumber(), price).toFixed();
            tokenMap[assetAddrASymbol] = {
              ...tokenMap[assetAddrASymbol],
              amount: newAmt.toFixed(),
              value: newValue,
            };
          } else {
            tokenMap[assetAddrASymbol] = tokenInfoObj;
          }
          curChainTotalBalance = add(curChainTotalBalance, rawValue.toNumber());
          totalBalance = add(totalBalance, rawValue.toNumber());
          prev[assetAddrASymbol] = tokenInfoObj;
        }
      }
      return prev;
    };
    const curChainAssetMap = curChainAssetArr.reduce(
      curChainAssetMapReduceF,
      {}
    );
    // // native token
    // const curChainNativeToken: any = nativeToken.find(
    //   (i: any) => i.chain === curChainName
    // );
    // const { balance, currentUsdPrice, currency } = curChainNativeToken;
    // const curChainNativeTokenAmount = div(parseInt(balance), Math.pow(10, 18));
    // const curChainNativeTokenAmountNum = curChainNativeTokenAmount.toNumber();
    // const price = currentUsdPrice ?? 0;
    // if (gt(curChainNativeTokenAmountNum, 0) && gt(price, 0)) {
    //   const rawValue = mul(curChainNativeTokenAmountNum, price);
    //   if (gt(rawValue.toNumber(), 0.01)) {
    //     const value = rawValue.toFixed();
    //     const tokenInfoObj = {
    //       symbol: currency,
    //       amount: curChainNativeTokenAmount.toFixed(),
    //       price,
    //       value,
    //       isNative: true,
    //       chain: curChainName,
    //     };
    //     if (currency in tokenMap) {
    //       const { amount: lastAmt } = tokenMap[currency];
    //       const newAmt = add(Number(lastAmt), curChainNativeTokenAmountNum);
    //       const newValue = mul(newAmt.toNumber(), price).toFixed();
    //       tokenMap[currency] = {
    //         ...tokenMap[currency],
    //         amount: newAmt.toFixed(),
    //         value: newValue,
    //       };
    //     } else {
    //       tokenMap[currency] = tokenInfoObj;
    //     }
    //     curChainTotalBalance = add(curChainTotalBalance, rawValue.toNumber());
    //     totalBalance = add(totalBalance, rawValue.toNumber());

    //     curChainAssetMap[currency] = {
    //       symbol: currency,
    //       amount: curChainNativeTokenAmount.toFixed(),
    //       price,
    //       value,
    //       isNative: true,
    //     };
    //   }
    // }
    if (gt(curChainTotalBalance.toNumber(), 0)) {
      prevChainsAssetMap[curChainName] = {
        totalBalance: curChainTotalBalance.toFixed(),
        tokenListMap: curChainAssetMap,
      };
    }

    return prevChainsAssetMap;
  };
  let chainsAssetsMap = Object.keys(erc20Token).reduce(
    chainsAssetsMapReduceF,
    {}
  );
  const chainsAssetsMapReduceF2: (
    prevChainsAssetMap: any,
    curChain: any
  ) => any = (prevChainsAssetMap, curChainNativeToken) => {
    // native token
    const {
      balance,
      currentUsdPrice,
      currency,
      chain: curChainName,
    } = curChainNativeToken;

    let { totalBalance: curChainTotalBalance, tokenListMap: curChainAssetMap } =
      prevChainsAssetMap[curChainName] ?? {
        totalBalance: '0',
        tokenListMap: {},
      };
    const curChainNativeTokenAmount = div(parseInt(balance), Math.pow(10, 18));
    const curChainNativeTokenAmountNum = curChainNativeTokenAmount.toNumber();
    const price = currentUsdPrice ?? 0;
    if (gt(curChainNativeTokenAmountNum, 0) && gt(price, 0)) {
      const rawValue = mul(curChainNativeTokenAmountNum, price);
      if (gt(rawValue.toNumber(), 0.01)) {
        const value = rawValue.toFixed();
        const tokenInfoObj = {
          symbol: currency,
          amount: curChainNativeTokenAmount.toFixed(),
          price,
          value,
          isNative: true,
          chain: curChainName,
        };
        if (currency in tokenMap) {
          const { amount: lastAmt } = tokenMap[currency];
          const newAmt = add(Number(lastAmt), curChainNativeTokenAmountNum);
          const newValue = mul(newAmt.toNumber(), price).toFixed();
          tokenMap[currency] = {
            ...tokenMap[currency],
            amount: newAmt.toFixed(),
            value: newValue,
          };
        } else {
          tokenMap[currency] = tokenInfoObj;
        }
        curChainTotalBalance = add(curChainTotalBalance, rawValue.toNumber());
        totalBalance = add(totalBalance, rawValue.toNumber());

        curChainAssetMap[currency] = {
          symbol: currency,
          amount: curChainNativeTokenAmount.toFixed(),
          price,
          value,
          isNative: true,
        };
      }
    }
    if (gt(curChainTotalBalance, 0)) {
      prevChainsAssetMap[curChainName] = {
        totalBalance: curChainTotalBalance.toFixed(),
        tokenListMap: curChainAssetMap,
      };
    }
    return prevChainsAssetMap;
  };
  chainsAssetsMap = nativeToken.reduce(
    chainsAssetsMapReduceF2,
    chainsAssetsMap
  );
  return {
    tokenListMap: tokenMap,
    chainsAssetsMap,
    totalBalance: totalBalance.toFixed(),
  };
};

// v1: targetVersion,v2:current version
// v1>v2 => 1
// v1=v2 => 0
// v1< v2 => -1
export function compareVersions(v1: string, v2: string) {
  var v1parts = v1.split('.');
  var v2parts = v2.split('.');

  for (var i = 0; i < v1parts.length; ++i) {
    if (v2parts.length === i) {
      return 1;
    }

    if (v1parts[i] === v2parts[i]) {
      continue;
    } else if (v1parts[i] > v2parts[i]) {
      return 1;
    } else {
      return -1;
    }
  }

  if (v1parts.length !== v2parts.length) {
    return -1;
  }

  return 0;
}

export const getTotalBalFromAssetsMap = (targetMap: AssetsMap) => {
  const totalAccBal = Object.keys(targetMap).reduce((prev, curr) => {
    const obj = targetMap[curr as keyof typeof targetMap];
    const curValue = obj.value;
    prev = add(Number(prev), Number(curValue));
    return prev;
  }, BIGZERO);
  const totalBalance = totalAccBal.toFixed();
  return totalBalance;
};
export const getTotalBalFromNumObjAPriceObj = (numObj, priceObj) => {
  const totalAccBal = Object.keys(numObj).reduce((prev, curr) => {
    const num = numObj[curr as keyof typeof numObj];
    const price = priceObj[curr as keyof typeof priceObj];
    const curValue = mul(num, price).toFixed();
    prev = add(Number(prev), Number(curValue));
    return prev;
  }, BIGZERO);
  const totalBalance = totalAccBal.toFixed();
  return totalBalance;
};

export const getAccount = (metaInfo: any, useInfo: any) => {
  let account = '';
  const lowerCaseDataSourceName = metaInfo.id;
  if (metaInfo.connectType === 'Web') {
    let userName = useInfo?.userInfo?.userName;
    if (userName) {
      account = userName;
    } else {
      account = '';
    }
  } else if (metaInfo.connectType === 'API') {
    account = useInfo.apiKey;
  } else if (metaInfo.connectType === 'Auth') {
    if (['discord'].includes(lowerCaseDataSourceName)) {
      account = useInfo?.userName;
    }
    if (lowerCaseDataSourceName === 'google') {
      account = useInfo?.email;
    }
    if (['x', 'github'].includes(lowerCaseDataSourceName)) {
      account = useInfo?.screenName;
    }
  }
  return account;
};

