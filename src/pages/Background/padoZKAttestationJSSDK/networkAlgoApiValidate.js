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
 * @param {'mpctls' | 'proxytls'} algorithmType
 * @param {Set<string> | string[]} allowedHosts
 * @returns {{ ok: boolean; reason?: string }}
 */
export function validateNetworkAlgoApis(algoApis, algorithmType, allowedHosts) {
  const allowedSet =
    allowedHosts instanceof Set
      ? allowedHosts
      : new Set((allowedHosts || []).map(normalizeHost).filter(Boolean));

  if (!allowedSet.size) {
    return { ok: false, reason: 'Node allowlist empty or not loaded' };
  }

  if (algorithmType !== 'mpctls' && algorithmType !== 'proxytls') {
    return { ok: false, reason: 'Unsupported algorithmType' };
  }

  const endpointIndex = algorithmType === 'proxytls' ? 1 : 0;
  const endpointHost = parseWssHost(algoApis?.[endpointIndex]);
  const proxyHost = parseWssHost(algoApis?.[2]);
  if (!endpointHost || !proxyHost) {
    return {
      ok: false,
      reason: `Missing or invalid wss URL in algoApis[${endpointIndex}] or algoApis[2]`,
    };
  }
  if (endpointHost !== proxyHost) {
    return {
      ok: false,
      reason: `algoApis[${endpointIndex}] and algoApis[2] host mismatch`,
    };
  }

  if (
    !isHostAllowed(endpointHost, allowedSet) ||
    !isHostAllowed(proxyHost, allowedSet)
  ) {
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