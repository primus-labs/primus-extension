import { queryJsonPathWithNegativeIndices } from '../../utils';
import { IDENTITY_DISPLAY_NAME_JSON_PATH } from './constants.js';

/**
 * @param {unknown} identityResponseData
 */
export function validateEmptyFeedsIdentityResponse(identityResponseData) {
  if (identityResponseData == null) {
    return false;
  }
  const { matched } = queryJsonPathWithNegativeIndices(
    IDENTITY_DISPLAY_NAME_JSON_PATH,
    identityResponseData,
    undefined
  );
  return matched === true;
}
