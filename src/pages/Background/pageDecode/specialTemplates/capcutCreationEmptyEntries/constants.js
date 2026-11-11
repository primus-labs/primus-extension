/** CapCut library creation count — empty entries fall back to get_ever_photo_token. */
export const TEMPLATE_ID_CAPCUT_CREATION =
  'abf3b33d-06cc-453d-8a90-927d4e2827ba';

export const ENTRIES_QUERY_URL_MARKER =
  '/api/v1/spaces/1/entries/query';

export const EVER_PHOTO_TOKEN_HOST = 'edit-api-sg.capcut.com';
export const EVER_PHOTO_TOKEN_PATH_MARKER =
  '/cc/v1/workspace/get_ever_photo_token';

export const EVER_PHOTO_TOKEN_TEMPLATE_URL =
  'https://edit-api-sg.capcut.com/cc/v1/workspace/get_ever_photo_token';

export const EVER_PHOTO_USER_ID_JSON_PATH = '$.data.ever_photo_user.user_id';

export const FALLBACK_REQUEST = {
  name: 'sdk-0',
  url: EVER_PHOTO_TOKEN_TEMPLATE_URL,
  urlType: 'REGX',
  method: 'POST',
};

export const FALLBACK_RESPONSE = {
  conditions: {
    type: 'CONDITION_EXPANSION',
    op: 'BOOLEAN_AND',
    subconditions: [
      {
        field: EVER_PHOTO_USER_ID_JSON_PATH,
        op: 'REVEAL_STRING',
        type: 'FIELD_REVEAL',
        reveal_id: 'userId',
      },
    ],
  },
  plaintext_outputs: [],
};
