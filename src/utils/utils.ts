import BigNumber from 'bignumber.js';
var ethereumjsUtil = require('ethereumjs-util');

export function sub(a: number, b: number) {
  return new BigNumber(a).minus(new BigNumber(b));
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
