/** Environment-based URL constants and storage-backed algo URL getters */
type ENVTYPE = 'development' | 'test' | 'production';

export const CURENV = process.env.NODE_ENV as ENVTYPE;

const PADOURLMAP: Record<ENVTYPE, string> = {
  development: 'wss://api-dev.padolabs.org/algorithm',
  test: '18.179.8.186:8888',
  production: 'wss://api.padolabs.org/algorithm',
};
export let PADOURL = PADOURLMAP[CURENV];

const ZKPADOURLMAP: Partial<Record<ENVTYPE, string>> = {
  development: 'wss://api-dev.padolabs.org/algorithm-proxy',
  production: 'wss://api.padolabs.org/algorithm-proxy',
};
export let ZKPADOURL = ZKPADOURLMAP[CURENV] ?? '';

const PROXYURLMAP: Record<ENVTYPE, string> = {
  development: 'wss://api-dev.padolabs.org/algoproxy',
  test: '18.179.8.186:9000',
  production: 'wss://api.padolabs.org/algoproxy',
};
export let PROXYURL = PROXYURLMAP[CURENV];

const PADOSERVERURLMAP: Record<ENVTYPE, string> = {
  development: 'https://api-dev.padolabs.org',
  test: 'http://18.179.8.186:8080',
  production: 'https://api.padolabs.org',
};
export const PADOSERVERURL = PADOSERVERURLMAP[CURENV];

const STORAGE_KEY = 'algorithmUrl';

export async function getPadoUrl(): Promise<string> {
  const { [STORAGE_KEY]: algorithmUrl } = await chrome.storage.local.get([
    STORAGE_KEY,
  ]);
  return algorithmUrl
    ? (JSON.parse(algorithmUrl) as { padoUrl?: string }).padoUrl ?? ''
    : '';
}

export async function getZkPadoUrl(): Promise<string> {
  const { [STORAGE_KEY]: algorithmUrl } = await chrome.storage.local.get([
    STORAGE_KEY,
  ]);
  return algorithmUrl
    ? (JSON.parse(algorithmUrl) as { zkPadoUrl?: string }).zkPadoUrl ?? ''
    : '';
}

export async function getProxyUrl(): Promise<string> {
  const { [STORAGE_KEY]: algorithmUrl } = await chrome.storage.local.get([
    STORAGE_KEY,
  ]);
  return algorithmUrl
    ? (JSON.parse(algorithmUrl) as { proxyUrl?: string }).proxyUrl ?? ''
    : '';
}
