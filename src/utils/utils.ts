import BigNumber from 'bignumber.js';
import numeral from 'numeral';
var ethereumjsUtil = require('ethereumjs-util');
import {PADOSERVERURLHTTPS} from '@/config/envConstants'

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

export function formatAddress(str: string) {
  const startS = str.substr(0, 6);
  const endS = str.substr(-4);
  return `${startS}...${endS}`;
}

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

// transform date from timestamp to string such as 12 Mar, 2023
export function formatDate(timestamp: number) {
  var date = new Date(timestamp),
    Y = date.getFullYear(),
    M = date.toLocaleString('en', { month: 'short' }),
    D = (date.getDate() + '').padStart(2, '0');
  return `${M} ${D}, ${Y}`;
}

export function getCurrentDate(timestamp?: any) {
  const time = timestamp ? +new Date(timestamp) : +new Date();
  return formatDate(time);
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
};
export function formatNumeral(num: string | number, params?: NumeralParams) {
  const {
    decimalPlaces = 2,
    withThousandSepartor = true,
    transferUnit = false,
  } = params ?? {
    decimalPlaces: 2,
    withThousandSepartor: true,
    transferUnit: false,
  };
  num = new BigNumber(num).toFixed(6); // fix: < 0.0000001 numeral error
  let formatReg = '0';
  if (withThousandSepartor) {
    formatReg = '0,0';
  }
  if (decimalPlaces) {
    formatReg += `.${'0'.repeat(decimalPlaces)}`;
  }
  if (transferUnit) {
    formatReg += `a`;
  }
  return numeral(num).format(formatReg).toUpperCase();
}

export function postMsg(port: chrome.runtime.Port, msg: any) {
  try {
    port.postMessage(msg);
  } catch (error: any) {
    throw new Error(error);
  }
}

export function exportJson(jsonStr: string, fileName: string) {
  const blob = new Blob([jsonStr], { type: 'application/json' });
  var url = window.URL.createObjectURL(blob);
  var aLink = document.createElement('a');
  aLink.style.display = 'none';
  aLink.href = url;
  aLink.setAttribute('download', fileName);
  document.body.appendChild(aLink);
  aLink.click();
  document.body.removeChild(aLink);
  window.URL.revokeObjectURL(url);
}

export function strToHex(str: string) {
  const value = Buffer.from(str, 'utf-8');
  const returnValue = ethereumjsUtil.bufferToHex(
    ethereumjsUtil.keccak256(value)
  );
  return returnValue;
}

type AuthParams = {
  source: string;
  state: string;
}
export function getAuthUrl(authParams: AuthParams) {
  const { source, state } = authParams;
  return `${PADOSERVERURLHTTPS}/public/render/${source}?state=${state}`;
}