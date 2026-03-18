/**
 * Keep-alive alarm to prevent Service Worker reclaim during active attestation.
 */
const KEEPALIVE_ALARM = 'sw-keepalive';

export function startKeepAlive() {
  chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.4 });
}

export function stopKeepAlive() {
  chrome.alarms.clear(KEEPALIVE_ALARM);
}

export function setupKeepAliveListener() {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === KEEPALIVE_ALARM) {
      // no-op; the alarm event itself wakes the SW
    }
  });
}
