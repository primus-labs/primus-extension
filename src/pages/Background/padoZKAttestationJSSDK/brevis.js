

let pollingUniProofIntervalTimer = ''
let dappTabId = null

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  if (tabId === dappTabId) {
    if (pollingUniProofIntervalTimer) {
      clearInterval(pollingUniProofIntervalTimer);
    }
  }
});