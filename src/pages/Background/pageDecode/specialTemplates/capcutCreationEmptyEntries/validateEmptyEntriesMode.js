import { queryJsonPathWithNegativeIndices } from '../../utils';
import { EVER_PHOTO_USER_ID_JSON_PATH } from './constants.js';

/**
 * @param {unknown} tokenResponseData
 */
export function validateEmptyEntriesUserIdResponse(tokenResponseData) {
  if (tokenResponseData == null) {
    return false;
  }
  const { matched } = queryJsonPathWithNegativeIndices(
    EVER_PHOTO_USER_ID_JSON_PATH,
    tokenResponseData,
    undefined
  );
  return matched === true;
}
