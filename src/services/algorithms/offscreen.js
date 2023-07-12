//import ccxt from 'ccxt';

Module = {};
Module.onRuntimeInitialized = async () => {
    console.log("off screen Module Initialized OK");
    chrome.runtime.sendMessage({ resType: 'algorithm', resMethodName: 'start', res: 'RuntimeInitialized' });
};

function init() {
    console.log("\ninit");

    var req_obj = {
        sayhello: "hello I am init from wasm client",
    }
    var json_str = JSON.stringify(req_obj);

    const Module_init = Module.cwrap('init', 'boolean', ['string']);
    const res = Module_init(json_str);

    console.log('init typeof res', typeof (res));
    console.log('init res', res);
    return res;
}
function getAttestation(req_obj) {
    console.log("\ngetAttestation");
    // make a request json
    /*var req_obj = {
        requestid: "1", // unique
        version: "1.0.0",
        proxyUrl: "ws://127.0.0.1:9000",
        source: "binance",
        baseUrl: "127.0.0.1:8080", // client <----> http-server, such as "https://api.binance.com"
        padoUrl: "127.0.0.1:8081", // client <----> pado-server
        getdatatime: (+new Date()).toString(),
        exchange: {
            apikey: "xxx",
            apisecret: "xxx",
            apipassword: "xxx"
        },
        sigFormat: "EAS-Ethereum",
        schemaType: "exchange-balance",
        schema: [
            { name: "source", type: "string" },
            { name: "useridhash", type: "string" },
            { name: "address", type: "string" },
            { name: "getdatatime", type: "string" },
            { name: "baseValue", type: "string" },
            { name: "balanceGreaterBaseValue", type: "string" },
        ],
        user: {
            userid: "0123456789",
            address: "0x2A46883d79e4Caf14BCC2Fbf18D9f12A8bB18D07",
            token: "xxx"
        },
        baseValue: "1000",
        ext: {
            extRequests: {
                // ...
            },
            signHash: {
                trueHash: "0x78dcd376165ff92037130b1a73f49b9ebc2d1dc3e0bac9b9e29c4991ebdd84ef",
                falseHash: "0x092c22fe27704e9b0c9b58550e78cb53b621930844a8008fc8a644aaccb0fa43"
            }
        }
    }*/
    var json_str = JSON.stringify(req_obj);
    const Module_getAttestation = Module.cwrap('getAttestation', 'string', ['string']);
    const res = Module_getAttestation(json_str);
    console.log('getAttestation typeof res', typeof (res));
    console.log('getAttestation res', res);
    return res;
}
function getAttestationResult() {
    console.log("\ngetAttestationResult");

    var req_obj = {
        requestid: "1", // unique
        // ... maybe others
    }
    var json_str = JSON.stringify(req_obj);
    const Module_getAttestationResult = Module.cwrap('getAttestationResult', 'string', ['string']);
    const res = Module_getAttestationResult(json_str);
    console.log('getAttestationResult typeof res', typeof (res));
    console.log('getAttestationResult res', res);
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

/*const extend = (...args) => Object.assign({}, ...args);
const isNumber = Number.isFinite;
const isString = (s) => (typeof s === 'string');
const asInteger = (x) => ((isNumber(x) || (isString(x) && x.length !== 0)) ? Math.trunc(Number(x)) : NaN);
const safeInteger = (o, k, $default) => {
    const n = asInteger(prop(o, k));
    return isNumber(n) ? n : $default;
};

function sign(path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
    if ((api === 'private') || (api === 'eapiPrivate') || (api === 'sapi' && path !== 'system/status') || (api === 'sapiV2') || (api === 'sapiV3') || (api === 'sapiV4') || (api === 'wapi' && path !== 'systemStatus') || (api === 'dapiPrivate') || (api === 'dapiPrivateV2') || (api === 'fapiPrivate') || (api === 'fapiPrivateV2')) {
        let query = undefined;
        let extendedParams = extend({
            'timestamp': Date.now,
        }, params);
        const recvWindow = safeInteger(params, 'recvWindow');
        if (recvWindow !== undefined) {
            extendedParams['recvWindow'] = recvWindow;
        }
        if ((api === 'sapi') && (path === 'asset/dust')) {
            query = this.urlencodeWithArrayRepeat(extendedParams);
        }
        else if ((path === 'batchOrders') || (path.indexOf('sub-account') >= 0) || (path === 'capital/withdraw/apply') || (path.indexOf('staking') >= 0)) {
            query = this.rawencode(extendedParams);
        }
        else {
            query = this.urlencode(extendedParams);
        }
        let signature = undefined;
        if (this.secret.indexOf('PRIVATE KEY') > -1) {
            signature = this.encodeURIComponent(rsa(query, this.secret, sha256));
        }
        else {
            signature = this.hmac(this.encode(query), this.encode(this.secret), sha256);
        }
        query += '&' + 'signature=' + signature;
        headers = {
            'X-MBX-APIKEY': this.apiKey,
        };
        if ((method === 'GET') || (method === 'DELETE') || (api === 'wapi')) {
            url += '?' + query;
        }
        else {
            body = query;
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
    }
    else {
        if (Object.keys(params).length) {
            url += '?' + this.urlencode(params);
        }
    }
    return { 'url': url, 'method': method, 'body': body, 'headers': headers };
}*/