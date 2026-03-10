var ethereumjsUtil = require('ethereumjs-util');

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
