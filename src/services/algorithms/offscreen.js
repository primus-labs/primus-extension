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
function getAttestation() {
    console.log("\ngetAttestation");
    // make a request json
    var req_obj = {
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
    }
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
        const res = getAttestation();
        chrome.runtime.sendMessage({ resType: 'algorithm', resMethodName: 'getAttestation', res: res });
    } else if (message.type === 'algorithm' && message.method === 'getAttestationResult') {
        const res = getAttestationResult();
        chrome.runtime.sendMessage({ resType: 'algorithm', resMethodName: 'getAttestationResult', res: res });
    }
});