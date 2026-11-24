/** Matches NodeStatus.REGISTERED in @primuslabs/network-js-sdk */
const NETWORK_NODE_STATUS_REGISTERED = 1;

/**
 * @param {string} raw
 * @returns {string}
 */
export function normalizeHost(raw) {
  if (raw == null) return '';
  const s = String(raw).trim().toLowerCase();
  return s;
}

/**
 * @param {string} wssUrl
 * @returns {string | null}
 */
export function parseWssHost(wssUrl) {
  if (!wssUrl || typeof wssUrl !== 'string') return null;
  const trimmed = wssUrl.trim();
  if (!/^wss:\/\//i.test(trimmed)) return null;
  try {
    const u = new URL(trimmed);
    const port = u.port || '443';
    if (port === '443') {
      return normalizeHost(`${u.hostname}:443`);
    }
    return normalizeHost(`${u.hostname}:${port}`);
  } catch {
    return null;
  }
}

/**
 * @param {string} parsedHost from parseWssHost
 * @param {Set<string>} allowedHosts
 * @returns {boolean}
 */
export function isHostAllowed(parsedHost, allowedHosts) {
  if (!parsedHost || !allowedHosts?.size) return false;
  const n = normalizeHost(parsedHost);
  if (allowedHosts.has(n)) return true;
  if (!n.includes(':')) {
    if (allowedHosts.has(`${n}:443`)) return true;
  }
  if (n.endsWith(':443')) {
    const withoutPort = n.slice(0, -4);
    if (allowedHosts.has(withoutPort)) return true;
  }
  return false;
}

/**
 * @param {string[] | undefined} algoApis
 * @param {Set<string> | string[]} allowedHosts
 * @returns {{ ok: boolean; reason?: string }}
 */
export function validateNetworkAlgoApis(algoApis, allowedHosts) {
  const allowedSet =
    allowedHosts instanceof Set
      ? allowedHosts
      : new Set((allowedHosts || []).map(normalizeHost).filter(Boolean));

  if (!allowedSet.size) {
    return { ok: false, reason: 'Node allowlist empty or not loaded' };
  }

  const algo0 = algoApis?.[0];
  const algo2 = algoApis?.[2];
  if (!algo0 || !algo2) {
    return { ok: false, reason: 'Missing algoApis[0] or algoApis[2]' };
  }

  const host0 = parseWssHost(algo0);
  const host2 = parseWssHost(algo2);
  if (!host0 || !host2) {
    return { ok: false, reason: 'Invalid wss URL in algoApis' };
  }
  if (host0 !== host2) {
    return { ok: false, reason: 'algoApis[0] and algoApis[2] host mismatch' };
  }

  const algo1 = algoApis?.[1];
  if (algo1 && String(algo1).trim()) {
    const host1 = parseWssHost(algo1);
    if (host1 && host1 !== host0) {
      return { ok: false, reason: 'algoApis[1] host mismatch' };
    }
  }

  if (!isHostAllowed(host0, allowedSet)) {
    return {
      ok: false,
      reason: 'Algorithm endpoint host not in registered network nodes',
    };
  }

  return { ok: true };
}

/**
 * @param {{ status: number; urls?: string[] }[]} rows
 * @returns {Set<string>}
 */
export function collectHostsFromNodeInfoRows(rows) {
  const hosts = new Set();
  (rows || []).forEach(({ status, urls }) => {
    if (Number(status) !== NETWORK_NODE_STATUS_REGISTERED) return;
    (urls || []).forEach((url) => {
      const h = normalizeHost(url);
      if (h) hosts.add(h);
    });
  });
  return hosts;
}