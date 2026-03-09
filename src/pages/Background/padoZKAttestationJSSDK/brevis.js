

let pollingUniProofIntervalTimer = ''
let dappTabId = null

chrome.tabs.onRemoved.addListener(async (tabId, _removeInfo) => {
  if (tabId === dappTabId) {
    if (pollingUniProofIntervalTimer) {
      clearInterval(pollingUniProofIntervalTimer);
    }
  }
});