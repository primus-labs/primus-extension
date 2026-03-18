import { safeStorageGet } from '@/utils/safeStorage';
import { safeJsonParse } from '@/utils/utils';

export const getErrorMsgTitleFn = async () => {
  const { padoZKAttestationJSSDKAttestationPresetParams } =
    await safeStorageGet([
      'padoZKAttestationJSSDKAttestationPresetParams',
    ]);
  const activeAttestationParams = safeJsonParse(padoZKAttestationJSSDKAttestationPresetParams, {}) || {};
  let eT = ['Assets Verification', 'Humanity Verification'].includes(
    activeAttestationParams.attestationType
  )
    ? `${activeAttestationParams.attestationType} failed!`
    : `${activeAttestationParams.attestationType} proof failed!`;
  return eT;
};
