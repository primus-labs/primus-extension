/** URL patterns that hide pageDecode popup (no imports — usable from node --test). */

export const DISABLED_PATH_SEGMENT_REGEX =
  /(?:^|[/?#])(?:login|register|signin|signup|signon|signout|loginout|forgotpassword|password_reset)(?:[/=?#]|$)/i;

export const DISABLED_AMAZON_URL_REGEX =
  /^https:\/\/(?:www\.)?amazon\.[^/]+\/(?:ax\/claim|ap\/cvf\/(?:transactionapproval|approval|verify|request|accountrecovery\/collectnewpassword)|ap\/accountfixup)/i;

export const DISABLED_STEAM_URL_REGEX =
  /^https:\/\/help\.steampowered\.com\/[^/]+\/wizard\/HelpWithLogin|^https:\/\/store\.steampowered\.com\/(?:mobile|join)/i;

export const DISABLED_NAVER_URL_REGEX =
  /^https:\/\/(?:nid\.naver\.com\/nidlogin\.login|appleid\.apple\.com\/auth\/authorize)(?:\?.*|#.*|\/|$)/i;

export const DISABLED_X_FLOW_URL_REGEX =
  /^https:\/\/(?:www\.)?x\.com(?:\/.+)?\/single_sign_on(?:\/|[?#]|$)/i;

export const DISABLED_GITHUB_TWO_FACTOR_URL_REGEX =
  /^https:\/\/github\.com\/sessions\/two-factor\/app(?:\?.*|#.*|\/|$)/i;

/** LinkedIn 2FA enroll + checkpoint/challenge/{dynamic id} */
export const DISABLED_LINKEDIN_MFA_URL_REGEX =
  /^https:\/\/(?:www\.)?linkedin\.com\/(?:mypreferences\/d\/two-factor-authentication\/enroll(?:[?#]|\/|$)|checkpoint\/challenge\/[^/?#]+)/i;

/** OpenAI auth.openai.com/mfa-challenge/{dynamic} */
export const DISABLED_OPENAI_MFA_URL_REGEX =
  /^https:\/\/auth\.openai\.com\/mfa-challenge\/[^/?#]+(?:[?#]|\/|$)/i;

/** X: app 2FA enrollment + JF onboarding /web (query/hash wildcards; x.com only) */
export const DISABLED_X_MFA_URL_REGEX =
  /^https:\/\/(?:www\.)?x\.com\/i\/(?:flow\/two-factor-auth-app-enrollment|jf\/onboarding\/web)(?:[?#]|\/|$)/i;
