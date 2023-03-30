import BigNumber from 'bignumber.js';

export function gt(a: number,b: number) {
  return new BigNumber(a).gt(new BigNumber(b))
}
export function gte(a: number,b: number) {
  return new BigNumber(a).gte(new BigNumber(b))
}
export function lt(a: number,b: number) {
  return new BigNumber(a).lt(new BigNumber(b))
}
export function lte(a: number,b: number) {
  return new BigNumber(a).lte(new BigNumber(b))
}
export function add(a: number,b: number) {
  return new BigNumber(a).plus(new BigNumber(b))
}
export function sub(a: number,b: number) {
  return new BigNumber(a).minus(new BigNumber(b))
}
export function mul(a: number,b: number) {
  return new BigNumber(a).times(new BigNumber(b))
}
export function div(a: number,b: number) {
  return new BigNumber(a).div(new BigNumber(b))
}

export  function formatAddress (str:string) {
  const startS = str.substr(0, 6)
  const endS = str.substr(-4)
  return `${startS}...${endS}`
}

export function getMutipleStorageSyncData (storageKeys: string[]):object {
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

export function getSingleStorageSyncData (storageKey: string) {
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
  M = date.toLocaleString('en', {month:'short'}),
  D = (date.getDate()+'').padStart(2, '0');
  return `${M} ${D},${Y}`;
}

export function getCurrentDate() {
  return formatDate(+new Date())
}

//format deciamls
export  function formatD (totalBalance: string, decimal: number = 2)  {
  return totalBalance ? `${new BigNumber(totalBalance).toFixed(decimal)}` : '-'
}
//format unit & deciamls
export  function formatUD (totalBalance: string)  {
  return `$${formatD(totalBalance)}`
}
