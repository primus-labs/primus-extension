import { getAlgoUrl } from '@/services/api/algorithm';
import {
  PADOURL,
  ZKPADOURL,
  PROXYURL,
} from '@/config/envConstants';

const STORAGE_KEY = 'algorithmUrl';

/**
 * Ensures algorithmUrl is in storage (with env defaults if missing), then
 * fetches live algo nodes, probes the first reachable one, and persists
 * its URLs to storage.
 */
export async function updateAlgoUrl(): Promise<void> {
  const { [STORAGE_KEY]: algorithmUrl } = await chrome.storage.local.get([
    STORAGE_KEY,
  ]);
  if (!algorithmUrl) {
    await chrome.storage.local.set({
      [STORAGE_KEY]: JSON.stringify({
        padoUrl: PADOURL,
        zkPadoUrl: ZKPADOURL,
        proxyUrl: PROXYURL,
      }),
    });
  }

  const res = await getAlgoUrl();
  if (res?.rc !== 0 || !res.result?.length) return;

  let inited = false;
  for (const item of res.result) {
    const ws = new WebSocket(`wss://${item.algoProxyDomain}/algoproxy`);
    await new Promise<void>((resolve) => {
      ws.onopen = async () => {
        if (!inited) {
          const payload = {
            padoUrl: `wss://${item.algorithmDomain}/algorithm`,
            zkPadoUrl: `wss://${item.algorithmDomain}/algorithm-proxy`,
            proxyUrl: `wss://${item.algoProxyDomain}/algoproxy`,
          };
          await chrome.storage.local.set({
            [STORAGE_KEY]: JSON.stringify(payload),
          });
          inited = true;
        }
        ws.close();
        resolve();
      };
      ws.onerror = () => resolve();
      ws.onclose = () => resolve();
    });
    if (inited) break;
  }
}
