/**
 * For template 21701f5e: after intercepting the first user_menu payloads request,
 * read owner.login from the response and update the data source tab URL to baseUrl + /{owner.login}.
 */

const GITHUB_USER_MENU_TEMPLATE_ID = '21701f5e-c90c-40a4-8ced-bc1696828f11';

const USER_MENU_URL_REGEX =
  /github\.com\/_global-navigation\/payloads\.json\?.*[?&]type=user_menu/;

/**
 * Safely extract owner.login from GitHub payloads response (object or array).
 */
function extractOwnerLogin(responseData) {
  if (responseData == null) return null;
  if (Array.isArray(responseData)) {
    for (const item of responseData) {
      const login = item?.owner?.login;
      if (login != null && String(login).trim()) return String(login).trim();
    }
    return null;
  }
  const login = responseData?.owner?.login;
  return login != null && String(login).trim() ? String(login).trim() : null;
}

/**
 * If template and URL match and not yet done, update the data source tab to baseUrl + /ownerLogin.
 * Uses state.specialTemplateGithubUserMenuRedirectDone so it runs only once per init.
 */
export async function tryUpdateTabFromUserMenuResponse({
  requestUrl,
  responseData,
  getState,
}) {
  const state = getState();
  if (state.specialTemplateGithubUserMenuRedirectDone) return;
  const id = state.activeTemplate?.attTemplateID;
  if (id !== GITHUB_USER_MENU_TEMPLATE_ID) return;
  
  if (
    !requestUrl ||
    typeof requestUrl !== 'string' ||
    !USER_MENU_URL_REGEX.test(requestUrl)
  ) {
    return;
  }
  

  const ownerLogin = extractOwnerLogin(responseData);
  if (!ownerLogin) return;

  const tabId = state.dataSourcePageTabId;
  const jumpTo = state.activeTemplate?.jumpTo;
  if (tabId == null || !jumpTo || typeof jumpTo !== 'string') return;

  const baseUrl = jumpTo.replace(/\/+$/, '');
  const newUrl = `${baseUrl}/${ownerLogin}`;

  try {
    await chrome.tabs.update(tabId, { url: newUrl });
    state.specialTemplateGithubUserMenuRedirectDone = true;
  } catch (e) {
    console.warn('specialTemplateGithubUserMenuRedirect: tabs.update failed', e);
  }
}
