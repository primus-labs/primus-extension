export const getErrorMsgTitleFn = async () => {
  const { padoZKAttestationJSSDKAttestationPresetParams } =
    await chrome.storage.local.get([
      'padoZKAttestationJSSDKAttestationPresetParams',
    ]);
  const activeAttestationParams = padoZKAttestationJSSDKAttestationPresetParams
    ? JSON.parse(padoZKAttestationJSSDKAttestationPresetParams)
    : {};
  let eT = ['Assets Verification', 'Humanity Verification'].includes(
    activeAttestationParams.attestationType
  )
    ? `${activeAttestationParams.attestationType} failed!`
    : `${activeAttestationParams.attestationType} proof failed!`;
  return eT;
};
