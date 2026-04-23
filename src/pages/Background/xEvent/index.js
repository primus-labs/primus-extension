/* global chrome, Map */
/**
 * xEvent / xPage orchestration: open X intent tab, relay result to caller tab.
 * Per-request state in Maps (no global singleton); optional client requestId (scheme A).
 */

const xEventMap = {
  follow: {
    url: `https://x.com/intent/follow`,
    queryKey: 'screen_name',
    eventName: 'followRes',
  },
  repost: {
    url: `https://x.com/intent/retweet`,
    queryKey: 'tweet_id',
    eventName: 'repostRes',
  },
};

/** @type {Map<string, { callerTabId: number, intentTabId: number, eventName: string, pageOriginTarget: string, done: boolean }>} */
const tasksByRequestId = new Map();

/** intent tab id -> requestId */
const intentTabToRequestId = new Map();

let tabRemovedListenerRegistered = false;

function cleanupTask(requestId) {
  const task = tasksByRequestId.get(requestId);
  if (task) {
    intentTabToRequestId.delete(task.intentTabId);
  }
  tasksByRequestId.delete(requestId);
}

async function cleanupExistingTaskIfAny(requestId) {
  const prevTask = tasksByRequestId.get(requestId);
  if (!prevTask) {
    return;
  }
  cleanupTask(requestId);
  try {
    await chrome.tabs.remove(prevTask.intentTabId);
  } catch (_e) {
    /* tab may already be gone */
  }
}

function notifyCallerFailure(task, requestId) {
  const meta = xEventMap[task.eventName];
  if (!meta) return;
  chrome.tabs
    .sendMessage(task.callerTabId, {
      type: 'xEvent',
      name: meta.eventName,
      params: {
        result: false,
        requestId,
      },
      pageOriginTarget: task.pageOriginTarget,
    })
    .catch(() => {});
}

function ensureTabRemovedListener() {
  if (tabRemovedListenerRegistered) {
    return;
  }
  tabRemovedListenerRegistered = true;
  chrome.tabs.onRemoved.addListener((tabId) => {
    const requestId = intentTabToRequestId.get(tabId);
    if (!requestId) {
      return;
    }
    const task = tasksByRequestId.get(requestId);
    intentTabToRequestId.delete(tabId);
    if (!task) {
      return;
    }
    if (task.done) {
      tasksByRequestId.delete(requestId);
      return;
    }
    task.done = true;
    notifyCallerFailure(task, requestId);
    tasksByRequestId.delete(requestId);
  });
}

export const listener = async (request, sender) => {
  ensureTabRemovedListener();

  const { type, name, params = {} } = request;
  const requestId =
    typeof request.requestId === 'string' && request.requestId.trim()
      ? request.requestId.trim()
      : typeof params.requestId === 'string' && params.requestId.trim()
        ? params.requestId.trim()
        : null;
  const pageOriginTarget = request.pageOriginTarget;

  if (type === 'xEvent') {
    if (!Object.prototype.hasOwnProperty.call(xEventMap, name)) {
      return;
    }
    if (!requestId) {
      return;
    }
    if (typeof pageOriginTarget !== 'string' || !pageOriginTarget) {
      return;
    }
    if (!sender.tab?.id) {
      return;
    }

    const callerTabId = sender.tab.id;
    const queryK = xEventMap[name].queryKey;
    const rawVal = params[queryK];
    const url = `${xEventMap[name].url}?${queryK}=${encodeURIComponent(
      rawVal != null ? String(rawVal) : ''
    )}`;

    await cleanupExistingTaskIfAny(requestId);
    const tabCreatedByPado = await chrome.tabs.create({ url });
    const intentTabId = tabCreatedByPado.id;

    tasksByRequestId.set(requestId, {
      callerTabId,
      intentTabId,
      eventName: name,
      pageOriginTarget,
      done: false,
    });
    intentTabToRequestId.set(intentTabId, requestId);
    return;
  }

  if (type === 'xPage') {
    if (!Object.prototype.hasOwnProperty.call(xEventMap, name)) {
      return;
    }
    const intentTabId = sender.tab?.id;
    if (intentTabId == null) {
      return;
    }
    const reqId = intentTabToRequestId.get(intentTabId);
    if (!reqId) {
      return;
    }
    const task = tasksByRequestId.get(reqId);
    if (!task || task.done) {
      return;
    }
    if (task.eventName !== name) {
      return;
    }

    task.done = true;
    intentTabToRequestId.delete(intentTabId);

    const outParams = { ...params, requestId: reqId };

    try {
      await chrome.tabs.remove(intentTabId);
    } catch (_e) {
      /* tab may already be gone */
    }

    chrome.tabs
      .sendMessage(task.callerTabId, {
        type: 'xEvent',
        name: xEventMap[name].eventName,
        params: outParams,
        pageOriginTarget: task.pageOriginTarget,
      })
      .catch(() => {});

    await chrome.tabs.update(task.callerTabId, { active: true });
    cleanupTask(reqId);
  }
};
