export const addSDKParamsToReportParamsFn = async (eventInfoRawData) => {
  let newRawData = JSON.parse(JSON.stringify(eventInfoRawData));
  const { padoZKAttestationJSSDKBeginAttest } = await chrome.storage.local.get([
    'padoZKAttestationJSSDKBeginAttest',
  ]);
  if (padoZKAttestationJSSDKBeginAttest) {
    const { padoZKAttestationJSSDKAttestationPresetParams } =
      await chrome.storage.local.get([
        'padoZKAttestationJSSDKAttestationPresetParams',
      ]);
    const activeAttestationParams =
      padoZKAttestationJSSDKAttestationPresetParams
        ? JSON.parse(padoZKAttestationJSSDKAttestationPresetParams)
        : {};
    const extendedParamsObj = activeAttestationParams?.extendedParams
      ? JSON.parse(activeAttestationParams.extendedParams)
      : {};
    const { attestOrigin, attTemplateID } = activeAttestationParams;
    const { appOrigin } = extendedParamsObj;

    if (appOrigin && appOrigin.split('-')[0] === 'NETWORK') {
      newRawData.event = appOrigin.split('-')[1];
    } else {
      // TODO report
      newRawData.event = attestOrigin;
    }
    newRawData.templateId = attTemplateID;
    if (extendedParamsObj?.appOrigin) {
      newRawData.appOrigin = appOrigin;
    }
    newRawData.attestOrigin = attestOrigin;
  }

  return newRawData;
};
