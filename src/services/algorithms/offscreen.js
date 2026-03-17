/**
 * Offscreen document script: wraps WASM algorithm (Module.callAlgorithm) and handles algorithm messages.
 * Module is global, provided by the Emscripten/WASM loader (e.g. client_plugin.js).
 */
/* global Module */

Module = typeof Module !== 'undefined' ? Module : {};
Module.onRuntimeInitialized = async () => {
  console.log('off screen Module Initialized OK');
  chrome.runtime.sendMessage({
    resType: 'algorithm',
    resMethodName: 'start',
    res: 'RuntimeInitialized',
  });
};

const CLIENT_VERSION = '1.4.18';

/**
 * Wraps WASM callAlgorithm for init, getAttestation, getAttestationResult, startOffline.
 */
class AlgorithmClient {
  constructor() {
    this.initialized = false;
  }

  _call(method, params = {}) {
    const reqObj = {
      method,
      version: CLIENT_VERSION,
      params,
    };
    const jsonStr = JSON.stringify(reqObj);
    const fn = Module.cwrap('callAlgorithm', 'string', ['string']);
    return fn(jsonStr);
  }

  async init(params) {
    console.log('init algorithms AlgorithmInited=', this.initialized);
    if (this.initialized) return;
    console.log('init...');
    this._call('setLogLevel',{ logLevel: "debug" }); // TODO: set log level to info or hide it 

    const initParams = { ...params, errLogUrl: '' };
    
    const res = this._call('init', initParams);
    console.log('init typeof res', typeof res, 'res', res);
    this.initialized = true;
    return res;
  }

  getAttestation(params) {
    console.log('getAttestation AlgorithmInited=', this.initialized);
    if (!this.initialized) {
      return JSON.stringify({
        content: null,
        retcode: '2',
        retdesc: 'Algorithm not initialized',
      });
    }
    const res = this._call('getAttestation', params);
    console.log('getAttestation typeof res', typeof res, 'res', res);
    return res;
  }

  getAttestationResult() {
    console.log('getAttestationResult');
    const res = this._call('getAttestationResult', { requestid: '1' });
    console.log('getAttestationResult typeof res', typeof res, 'res', res);
    return res;
  }

  startOffline(params) {
    console.log('startOffline AlgorithmInited=', this.initialized);
    if (!this.initialized) {
      return JSON.stringify({
        content: null,
        retcode: '2',
        retdesc: 'Algorithm not initialized',
      });
    }
    const res = this._call('startOffline', params);
    console.log('startOffline typeof res', typeof res, 'res', res);
    return res;
  }
}

const algorithmClient = new AlgorithmClient();

chrome.runtime.onMessage.addListener((message) => {
  console.log('offscreen onMessage message', message);
  if (message.type !== 'algorithm') return;

  if (message.method === 'init') {
    const res = algorithmClient.init(message.params);
    chrome.runtime.sendMessage({
      resType: 'algorithm',
      resMethodName: 'init',
      res,
    });
  } else if (message.method === 'getAttestation') {
    const rawData = {
      source: message.params.source,
      schemaType: message.params.schemaType,
      sigFormat: message.params.sigFormat,
      attestationId: message.params.requestid,
      event: message.params.event,
      address:
        message.params?.user?.address,
      requestid: message.params.requestid,
      order: '4',
    };
    chrome.runtime.sendMessage({
      resType: 'report',
      name: 'offscreenReceiveGetAttestation',
      params: { ...rawData },
    });
    const res = algorithmClient.getAttestation(message.params);
    chrome.runtime.sendMessage({
      resType: 'algorithm',
      resMethodName: 'getAttestation',
      res,
      requestid: message.params.requestid,
    });
  } else if (message.method === 'getAttestationResult') {
    const res = algorithmClient.getAttestationResult();
    chrome.runtime.sendMessage({
      resType: 'algorithm',
      resMethodName: 'getAttestationResult',
      res,
    });
  } else if (message.method === 'startOffline') {
    const res = algorithmClient.startOffline(message.params);
    chrome.runtime.sendMessage({
      resType: 'algorithm',
      resMethodName: 'startOffline',
      res,
    });
  }
});
