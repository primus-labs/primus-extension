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
        port.onMessage.addListener(processMsg);
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
const processMsg = (message, port) => {
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
