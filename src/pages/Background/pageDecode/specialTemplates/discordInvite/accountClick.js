/**
 * Keeps clicking Discord account targets until all configured requests have
 * been captured for the invite template.
 */
/* global chrome, console */
import { getPageDecodeState } from '../../state.js';
import { matches as matchesDiscordInviteTemplate } from './templateId.js';

const TARGET_POLL_INTERVAL_MS = 500;

/** @type {Map<number, { running: boolean }>} */
const flowByTabId = new Map();

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getDiscordSessionStatus(tabId) {
  const { state } = getPageDecodeState();
  const isCurrent =
    state.dataSourcePageTabId === tabId &&
    matchesDiscordInviteTemplate(state.activeTemplate);
  return {
    isCurrent,
    isReady: isCurrent && state.isReadyRequest,
  };
}

async function clickDiscordAccountTarget(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    func: () => {
      const hasClassPrefix = (el, prefix) =>
        el instanceof HTMLElement &&
        Array.from(el.classList).some((name) =>
          name.startsWith(`${prefix}__`)
        );

      const isVisible = (el) => {
        if (!(el instanceof HTMLElement) || !el.isConnected) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        const style = window.getComputedStyle(el);
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.pointerEvents !== 'none'
        );
      };

      const candidates = [];
      const pushCandidate = (el, match) => {
        if (!isVisible(el)) return;
        if (candidates.some((item) => item.el === el)) return;
        candidates.push({ el, match });
      };

      document
        .querySelectorAll('[class*="accountPopoutButtonWrapper"]')
        .forEach((el) => {
          if (hasClassPrefix(el, 'accountPopoutButtonWrapper')) {
            pushCandidate(el, 'accountPopoutButtonWrapper');
          }
        });

      document
        .querySelectorAll('[class*="accountPopoutButton"]')
        .forEach((el) => {
          if (hasClassPrefix(el, 'accountPopoutButton')) {
            pushCandidate(el, 'accountPopoutButton');
          }
        });

      document
        .querySelectorAll('[class*="wrapper"][class*="avatar"]')
        .forEach((el) => {
          if (
            hasClassPrefix(el, 'wrapper') &&
            hasClassPrefix(el, 'avatar')
          ) {
            pushCandidate(el, 'wrapper avatar');
          }
        });

      document.querySelectorAll('[class*="nameTag"]').forEach((el) => {
        if (hasClassPrefix(el, 'nameTag')) {
          pushCandidate(el, 'nameTag');
        }
      });

      const candidate = candidates[0];
      if (!candidate) {
        return {
          clicked: false,
          reason: 'no_visible_candidate',
        };
      }

      const matchedTarget = candidate.el;
      const target =
        matchedTarget.matches('[role="button"], button')
          ? matchedTarget
          : matchedTarget.querySelector('[role="button"], button') ||
            matchedTarget.closest('[role="button"], button') ||
            matchedTarget;
      if (typeof target.focus === 'function') {
        target.focus();
      }
      const mouseOptions = {
        bubbles: true,
        cancelable: true,
        view: window,
      };
      if (typeof PointerEvent === 'function') {
        target.dispatchEvent(
          new PointerEvent('pointerdown', {
            ...mouseOptions,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
          })
        );
        target.dispatchEvent(
          new PointerEvent('pointerup', {
            ...mouseOptions,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
          })
        );
      }
      target.dispatchEvent(new MouseEvent('mousedown', mouseOptions));
      target.dispatchEvent(new MouseEvent('mouseup', mouseOptions));
      target.click();

      return {
        clicked: true,
        match: candidate.match,
        className: matchedTarget.className || '',
      };
    },
  });
  return result || {
    clicked: false,
    reason: 'missing_execute_script_result',
  };
}

async function runDiscordAccountClickFlow(tabId, context) {
  if (context.running) return;
  context.running = true;
  console.log('discordAccountClick: started', tabId);

  try {
    let attempt = 0;
    while (flowByTabId.get(tabId) === context) {
      const status = getDiscordSessionStatus(tabId);
      if (!status.isCurrent) {
        console.log('discordAccountClick: session ended');
        return;
      }
      if (status.isReady) {
        console.log('discordAccountClick: requests ready');
        return;
      }

      try {
        const result = await clickDiscordAccountTarget(tabId);
        if (result.clicked) {
          console.log('discordAccountClick: target clicked', {
            match: result.match,
            className: result.className,
          });
        } else if (attempt % 20 === 0) {
          console.log(
            'discordAccountClick: no visible candidate',
            result.reason
          );
        }
      } catch (e) {
        if (attempt % 10 === 0) {
          console.warn('discordAccountClick: target lookup failed', e);
        }
      }
      attempt += 1;
      await delay(TARGET_POLL_INTERVAL_MS);
    }
  } finally {
    context.running = false;
  }
}

/**
 * @param {number | null | undefined} tabId
 * @param {object | null | undefined} activeTemplate
 */
export function startDiscordAccountClick(tabId, activeTemplate) {
  if (tabId == null || !matchesDiscordInviteTemplate(activeTemplate)) {
    return;
  }

  const context = { running: false };
  flowByTabId.set(tabId, context);
  void runDiscordAccountClickFlow(tabId, context);
}

/**
 * @param {number | null | undefined} tabId
 */
export function stopDiscordAccountClick(tabId) {
  if (tabId == null) return;
  flowByTabId.delete(tabId);
}
