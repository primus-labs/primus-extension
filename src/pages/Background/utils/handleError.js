import { getSdkAttestationPreset } from '../padoZKAttestationJSSDK/sessionStorage.js';

export const getErrorMsgTitleFn = async () => {
  const activeAttestationParams = (await getSdkAttestationPreset()) || {};
  let eT = ['Assets Verification', 'Humanity Verification'].includes(
    activeAttestationParams.attestationType
  )
    ? `${activeAttestationParams.attestationType} failed!`
    : `${activeAttestationParams.attestationType} proof failed!`;
  return eT;
};
