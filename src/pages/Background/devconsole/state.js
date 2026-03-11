/**
 * Shared state for dev console: data source tab id/urls, devconsole tab id, requests map.
 */
const state = {
  checkDataSourcePageTabId: null,
  checkDataSourcePageTabUrl: null,
  checkDataSourcePageTabUrls: [],
  devconsoleTabId: null,
  requestsMap: {},
};

export function getDevconsoleState() {
  return state;
}

export function resetDevconsoleState() {
  state.checkDataSourcePageTabId = null;
  state.checkDataSourcePageTabUrl = null;
  state.checkDataSourcePageTabUrls = [];
  state.requestsMap = {};
}
