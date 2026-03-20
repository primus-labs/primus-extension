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

const CLIENT_VERSION = '1.4.19';
const LEGACY_NETWORK_VERSION = '1.1.1';

/**
 * Returns effective algorithm version based on clientType.
 * clientType.toLowerCase().includes('network') -> 1.1.1, otherwise main version.
 */
function getEffectiveVersion(clientType) {
  const ct = (clientType || '').toLowerCase();
  return ct.includes('network') ? LEGACY_NETWORK_VERSION : CLIENT_VERSION;
}

/**
 * Wraps WASM callAlgorithm for init, getAttestation, getAttestationResult, startOffline.
 */
class AlgorithmClient {
  constructor() {
    this.initialized = false;
    this.lastInitVersion = null;
  }

  _call(method, params = {}, version) {
    const reqObj = {
      method,
      version: version || CLIENT_VERSION,
      params,
    };
    const jsonStr = JSON.stringify(reqObj);
    const fn = Module.cwrap('callAlgorithm', 'string', ['string']);
    return fn(jsonStr);
  }

  async init(params) {
    let clientType = params?.clientType;
    if (clientType == null || clientType === '') {
      try {
        const stored = await chrome.storage.local.get(['padoZKAttestationJSSDKClientType']);
        clientType = stored?.padoZKAttestationJSSDKClientType || '';
      } catch (_e) {
        clientType = '';
      }
    }
    const effectiveVersion = getEffectiveVersion(clientType);
    if (this.initialized && effectiveVersion !== this.lastInitVersion) {
      this.initialized = false;
    }
    console.log('init algorithms AlgorithmInited=', this.initialized, 'effectiveVersion=', effectiveVersion);
    if (this.initialized) return;
    console.log('init...');
    this._call('setLogLevel', { logLevel: 'debug' }, effectiveVersion);

    const initParams = { ...params, errLogUrl: params?.errLogUrl ?? '' };

    const res = this._call('init', initParams, effectiveVersion);
    console.log('init typeof res', typeof res, 'res', res);
    this.initialized = true;
    this.lastInitVersion = effectiveVersion;
    return res;
  }

  getAttestation(params) {
    const effectiveVersion = getEffectiveVersion(params?.clientType);
    console.log('getAttestation AlgorithmInited=', this.initialized);
    if (!this.initialized) {
      return JSON.stringify({
        content: null,
        retcode: '2',
        retdesc: 'Algorithm not initialized',
      });
    }
    const res = this._call('getAttestation', params, effectiveVersion);
    console.log('getAttestation typeof res', typeof res, 'res', res);
    return res;
  }

  getAttestationResult(params = {}) {
    const effectiveVersion = getEffectiveVersion(params?.clientType);
    console.log('getAttestationResult');
    const res = this._call('getAttestationResult', { requestid: '1' }, effectiveVersion);
    console.log('getAttestationResult typeof res', typeof res, 'res', res);
    return res;
  }

  startOffline(params) {
    const effectiveVersion = getEffectiveVersion(params?.clientType);
    console.log('startOffline AlgorithmInited=', this.initialized);
    if (!this.initialized) {
      return JSON.stringify({
        content: null,
        retcode: '2',
        retdesc: 'Algorithm not initialized',
      });
    }
    const res = this._call('startOffline', params, effectiveVersion);
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
    const res = algorithmClient.getAttestationResult(message.params || {});
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
