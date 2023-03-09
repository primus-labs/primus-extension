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
chrome.storage.local.set({ a: '1' }, () => {
  console.log('suc======')
})