//import ccxt from 'ccxt';

Module = {};
Module.onRuntimeInitialized = async () => {
    console.log("off screen Module Initialized OK");
    chrome.runtime.sendMessage({ resType: 'algorithm', resMethodName: 'start', res: 'RuntimeInitialized' });
};

var AlgorithmInited = false;
var ClientVersion = "1.1.0";

function init() {
    console.log("init");

    var req_obj = {
        method: "init",
        version: ClientVersion,
        params: {}
    };
    var json_str = JSON.stringify(req_obj);

    const Module_init = Module.cwrap('callAlgorithm', 'string', ['string']);
    const res = Module_init(json_str);

    console.log('init typeof res', typeof (res));
    console.log('init res', res);
    AlgorithmInited = true;
    console.log("init AlgorithmInited=", AlgorithmInited);
    return res;
}
function getAttestation(params) {
    console.log("getAttestation AlgorithmInited=", AlgorithmInited);
    if (!AlgorithmInited) {
        const resobj = {"content":null,"retcode":"2","retdesc":"Algorithm not initialized"};
        return JSON.stringify(resobj);
    }
    var req_obj = {
        method: "getAttestation",
        version: ClientVersion,
        params: params
    };
    var json_str = JSON.stringify(req_obj);
    const Module_getAttestation = Module.cwrap('callAlgorithm', 'string', ['string']);
    const res = Module_getAttestation(json_str);
    console.log('getAttestation typeof res', typeof (res));
    console.log('getAttestation res', res);
    return res;
}
function getAttestationResult() {
    console.log("getAttestationResult");
    var req_obj = {
        method: "getAttestationResult",
        version: ClientVersion,
        params: {
          requestid: "1"
        }
    };
    var json_str = JSON.stringify(req_obj);
    const Module_getAttestationResult = Module.cwrap('callAlgorithm', 'string', ['string']);
    const res = Module_getAttestationResult(json_str);
    console.log('getAttestationResult typeof res', typeof (res));
    console.log('getAttestationResult res', res);
    return res;
}

function startOffline(params) {
    console.log("startOffline AlgorithmInited=", AlgorithmInited);
    if (!AlgorithmInited) {
        const resobj = {"content":null,"retcode":"2","retdesc":"Algorithm not initialized"};
        return JSON.stringify(resobj);
    }
    var req_obj = {
      method: "startOffline",
      version: ClientVersion,
      params: params
    };
    var json_str = JSON.stringify(req_obj);
    const Module_startOffline = Module.cwrap('callAlgorithm', 'string', ['string']);
    const res = Module_startOffline(json_str);
    console.log('startOffline typeof res', typeof (res));
    console.log('startOffline res:', res);
    return res;
  }

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('offscreen onMessage message', message);
    if (message.type === 'algorithm' && message.method === 'init') {
        const res = init();
        chrome.runtime.sendMessage({ resType: 'algorithm', resMethodName: 'init', res: res });
    } else if (message.type === 'algorithm' && message.method === 'getAttestation') {
        const res = getAttestation(message.params);
        EXCHANGEINFO = message.exInfo;


        /*const test = {
            "method": "getSign",
            "params": {
                "source": "binance",
                "schemaType": "Assets Proof"
            }
        };
        test.params.source = message.params.source;
        test.params.schemaType = message.params.schemaType;
        if (test.params.schemaType === 'Token Holdings') {
            test.params.holdingToken = message.params.holdingToken;
        }
        call(JSON.stringify(test));*/
        chrome.runtime.sendMessage({ resType: 'algorithm', resMethodName: 'getAttestation', res: res });
    } else if (message.type === 'algorithm' && message.method === 'getAttestationResult') {
        const res = getAttestationResult();
        chrome.runtime.sendMessage({ resType: 'algorithm', resMethodName: 'getAttestationResult', res: res });
    } else if (message.type === 'algorithm' && message.method === 'startOffline') {
        const res = startOffline(message.params);
        chrome.runtime.sendMessage({ resType: 'algorithm', resMethodName: 'startOffline', res: res });
    }
});

let EXCHANGEINFO = {};

/*
params str:
{
    "method": "getSign",
    "params": {
        "source": "binance",// or "okx"
        "schemaType": "Assets Proof", // or "Token Holdings"
        "holdingToken": "BTC" // Token Holdings must have the field 
    }
}

return:
binance:
{
    "url": "https://api.binance.com/sapi/v3/asset/getUserAsset",
    "method": "POST",
    "body": "timestamp=1688711841427&recvWindow=60000&signature=7da7ada2683d52532681cc5d420fd0ec678eb99935c5f6cd7168aa1313ba9ad3",
    "headers": {
        "X-MBX-APIKEY": "tPekpYpExdV5pzzc9ZyLApIXQkYMiLWiygjKBAQzUCiy3G2fVtNGxGTJ4NtfZq31",
        "Content-Type": "application/x-www-form-urlencoded"
    }
}
okx:
{
    "url": "https://www.okx.com/api/v5/account/balance?ccy=USDT",
    "method": "GET",
    "headers": {
        "OK-ACCESS-KEY": "8a236275-eedc-46d9-a592-485fb38d1dfe",
        "OK-ACCESS-PASSPHRASE": "Padopado@2022",
        "OK-ACCESS-TIMESTAMP": "2023-07-07T06:52:21.505Z",
        "OK-ACCESS-SIGN": "4yO+12YDmxSf1eRQTRiufQrGW39og0hvvFl/g83g7w4="
    }
}
*/
function call(str) {
    console.log("offscreen call str=", str);
    const jsonParams = JSON.parse(str);
    console.log("offscreen call source info=", EXCHANGEINFO[jsonParams.params.source]);
    if (jsonParams.method === "getSign") {
        const source = jsonParams.params.source;
        const apiKey = EXCHANGEINFO[source].apiKey;
        const secretKey = EXCHANGEINFO[source].secretKey;
        const passphase = EXCHANGEINFO[source].passphase;
        const exchange = new ccxt[source]({
            apiKey: apiKey,
            secret: secretKey,
            password: passphase,
        });
        console.log('offscreen call exchange=', exchange);
        let res;
        let signParams;
        let path;
        switch(source) {
            case 'binance':
                signParams = {recvWindow: 60 * 1000};
                if (jsonParams.params.schemaType === 'Token Holdings') {
                    signParams.asset = jsonParams.params.holdingToken;
                }
                res = exchange.sign('asset/getUserAsset', 'sapiV3', 'POST', signParams);
                console.log('offscreen call binance res=', res);
                return JSON.stringify(res);
            case 'okx':
                signParams = {};
                if (jsonParams.params.schemaType === 'Token Holdings') {
                    signParams.ccy = jsonParams.params.holdingToken;
                }
                res = exchange.sign('account/balance', 'private', 'GET', signParams);
                console.log('offscreen call okx res=', res);
                return JSON.stringify(res);
            case 'coinbase':
                path = 'accounts';
                signParams = {limit: 100};
                if (jsonParams.params.schemaType === 'Token Holdings') {
                    path = 'accounts/{account_id}';
                    signParams = {account_id: jsonParams.params.holdingToken};
                }
                res = exchange.sign(path, ['v2', 'private'], 'GET', signParams);
                console.log('offscreen call coinbase res=', res);
                return JSON.stringify(res);
        }
    }
    return "{}";
}
