/** Hailuo AI creation count template — empty feeds fall back to identity lookup. */
export const TEMPLATE_ID_HAILUO_CREATION =
  'b67a9894-f3b3-4fd2-ba32-0097e83d4514';

export const HAILUO_CREATION_MY_URL_MARKER = '/api/feed/creation/my';

export const IDENTITY_LOOKUP_HOST = 'identitytoolkit.googleapis.com';
export const IDENTITY_LOOKUP_PATH_MARKER = 'accounts:lookup';

export const IDENTITY_LOOKUP_TEMPLATE_URL =
  'https://identitytoolkit.googleapis.com/v1/accounts:lookup\\?.*';

export const IDENTITY_DISPLAY_NAME_JSON_PATH = '$.users[0].displayName';

export const FALLBACK_REQUEST = {
  name: 'sdk-0',
  url: IDENTITY_LOOKUP_TEMPLATE_URL,
  urlType: 'REGX',
  method: 'POST',
};

export const FALLBACK_RESPONSE = {
  conditions: {
    type: 'CONDITION_EXPANSION',
    op: 'BOOLEAN_AND',
    subconditions: [
      {
        field: IDENTITY_DISPLAY_NAME_JSON_PATH,
        op: 'REVEAL_STRING',
        type: 'FIELD_REVEAL',
        reveal_id: 'userName',
      },
    ],
  },
  plaintext_outputs: [],
};
