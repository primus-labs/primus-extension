import BigNumber from 'bignumber.js';
var ethereumjsUtil = require('ethereumjs-util');

export function sub(a: number, b: number) {
  return new BigNumber(a).minus(new BigNumber(b));
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

export function getCurrentDate(timestamp?: any, separator = ',') {
  const time = timestamp ? +new Date(timestamp) : +new Date();
  return formatDate(time, separator);
}

export function postMsg(port: chrome.runtime.Port, msg: any) {
  try {
    console.log('postMsg port: ', port, 'msg:', msg);
    port.postMessage(msg);
  } catch (error: any) {
    console.log('postMsg error: ', error);
  }
}

export function strToHex(str: string) {
  const value = Buffer.from(str, 'utf-8');
  const returnValue = ethereumjsUtil.bufferToHex(
    ethereumjsUtil.keccak256(value)
  );
  return returnValue;
}
