import {getAllOAuthSources, checkIsLogin} from '@/services/user'
import Module from './hello'
Module['onRuntimeInitialized'] = () => {
  Module.ccall(
      "myFunction", // name of C function
      null, // return type
      null, // argument types
      null // arguments
  )
};
console.log('This is the background page.');
console.log('Put the background scripts here.');
chrome.runtime.onInstalled.addListener(({ reason, version }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    showIndex();
  }
});

chrome.action.onClicked.addListener((tab) => {
  showIndex();
});

const showIndex = (info, tab)=> {
  let url = chrome.runtime.getURL("home.html");
  chrome.tabs.create({ url });
}

// listen msg from extension tab page
chrome.runtime.onConnect.addListener(
  (port) => {
    switch (port.name) {
      case "invokealgo":
        console.log("invokealgo connectted port=", port);
        port.onMessage.addListener(processAlgoMsg);
        break;
      case "networkreq":
        console.log("networkreq connectted port=", port);
        port.onMessage.addListener(processNetworkReq);
        break;
      case "padoService":
        console.log("padoService connectted port=", port);
        port.onMessage.addListener(processpadoServiceReq);
        break;
      default:
        break;
    }
  }
);

/*
message : {
  requestId,
  algoMethod, // start or getData
  algoParams { // this is getData params, start only proxyUrl
    source,
    host,
    path,
    appKey,
    appSecret,
    netMethod,
    netParams
  }
}
*/
const processAlgoMsg = (message, port) => {
  switch (message.algoMethod) {
    case "start":
      console.log("recv start=", message.algoParams.proxyUrl);
      Module.ccall(
        "myFunction", // name of C function
        null, // return type
        null, // argument types
        null // arguments
      );
      port.postMessage({requestId: message.requestId, result: "success" });
      break;
    case "getData":
      break;
    default:
      break;
  }
}

/*
message : {
  requestId,
  type,
  params {
    appKey,
    appSecret,
    functionName,
    funcParams
  }
}
*/
const processNetworkReq = async (message, port) => {
  switch (message.type) {
    case "exchange-binance":
      const response = await processBinaceReq(message);
      console.log('exchange-binance response', response);
      port.postMessage({requestId: message.requestId, type: message.type,
        function: message.params.functionName, data: response });
      break;
    default:
      break;
  }
}

const processBinaceReq = async (message) => {
  const res = await fetch("https://api.binance.com/sapi/v1/system/status");
  const resJson = res.json();
  return resJson;
}

const processpadoServiceReq  = async (message, port) => {
  switch (message.reqMethodName) {
    case "getAllOAuthSources":
      const response = await getAllOAuthSources();
      const { rc, result } = response
      if (rc === 0) {
        port.postMessage({resMethodName: message.reqMethodName, res: result });
      }
      break;
    case "auth":
      const { source, state } = message.params
      const windowOptions = {
        url:`https://18.179.8.186:8081/public/render/${source}?state=${state}`,
        // state: 'minimized',
        type:'popup',
        // top: parseInt(screen.availHeight/4),
        // left: parseInt(screen.availWidth/3),
        // width: screen.availWidth/3,
        // height: screen.availHeight/2
      }
      chrome.windows.create(windowOptions)
      .then(res => {
        console.log('授权Url:', windowOptions.url)
        const newWindowId = res.tabs[0].windowId
        fetchGetIsLogin(state, newWindowId, message.reqMethodName, port)
      })
      break;
    default:
      break;
  }
}
const fetchGetIsLogin = async(state,windowId, resMethodName, port) => {
  console.log('windowId:', windowId)
  let queryLoginTimer;
  const response = await checkIsLogin({state})
  const { rc, msg, result } = response
  if (rc === 0 && result.uniqueId) {
    clearTimeout(queryLoginTimer)
    chrome.storage.local.set({ userInfo: JSON.stringify(result) })
    chrome.windows.remove(windowId)
    port.postMessage({resMethodName: resMethodName, res: 'success' });
  } else {
    queryLoginTimer = setTimeout(async() => {
      fetchGetIsLogin(state,windowId, resMethodName, port)
    }, 500)
  }
}
