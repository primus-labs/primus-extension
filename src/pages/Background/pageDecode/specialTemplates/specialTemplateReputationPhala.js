/**
 * Phala Cloud templates: account email (3630e4cc), reputation CVM list (efcce302…f91e).
 */
import { reputationPhalaCvmListCheckTime } from '@/services/api/phala';
import { getPageDecodeState } from '../state';

export const TEMPLATE_ID_FOR_PHALA_ACCOUNT =
  '3630e4cc-9329-44c5-a4ed-25fbe5e195a3';

/** Reputation Phala CVM list (branchA name kept: Reputaion) */
export const TEMPLATE_ID_FOR_REPUTATION_PHALA_CVM_LIST =
  'efcce302-2405-4b4e-8920-952abec1f91e';

export const TRUE_REQUEST_URL_FOR_PHALA_ACCOUNT =
  'https://cloud-api.phala.com/api/v1/auth/me';

export const PHALA_CVM_LIST_BATCH_STATUS_URL =
  'https://cloud.phala.com/api/status/batch';

function getPhalaFields() {
  return getPageDecodeState().getReputationPhalaFields();
}

function resetReputationPhalaFields() {
  getPageDecodeState().resetReputationPhalaFields();
}

function setReputationPhalaFields(fields) {
  return getPageDecodeState().setReputationPhalaFields(fields);
}

export function isPhalaAccountTemplate(activeTemplate) {
  const id = activeTemplate?.attTemplateID ?? activeTemplate?.id;
  return id === TEMPLATE_ID_FOR_PHALA_ACCOUNT;
}

export function isReputationPhalaCvmListTemplate(activeTemplate) {
  const id = activeTemplate?.attTemplateID ?? activeTemplate?.id;
  return id === TEMPLATE_ID_FOR_REPUTATION_PHALA_CVM_LIST;
}

async function reputationPhalaCvmListCheckTimeFn(cvmUpdateTimeArr) {
  try {
    const { rc, result } = await reputationPhalaCvmListCheckTime(
      cvmUpdateTimeArr
    );
    if (rc === 0 && result) {
      return true;
    }
  } catch (_e) {
    /* ignore */
  }
  return false;
}

function buildReputationPhalaCvmListContext(matchRequestUrlResult) {
  if (
    !matchRequestUrlResult ||
    typeof matchRequestUrlResult !== 'object' ||
    Array.isArray(matchRequestUrlResult)
  ) {
    return null;
  }
  const cvmIdList = Object.keys(matchRequestUrlResult);
  if (cvmIdList.length === 0) {
    return null;
  }
  const updateTimeArr = cvmIdList.map(
    (cvmId) => matchRequestUrlResult?.[cvmId]?.uptime
  );
  return {
    cvmIdList,
    updateTimeArr,
  };
}

export async function checkTargetRequestFnForReputationPhalaCvmList(
  matchRequestUrlResult,
  notMetHandler
) {
  resetReputationPhalaFields();
  const phalaContext = buildReputationPhalaCvmListContext(matchRequestUrlResult);
  if (!phalaContext) {
    return false;
  }
  const ok = await reputationPhalaCvmListCheckTimeFn(
    phalaContext.updateTimeArr
  );
  if (ok) {
    setReputationPhalaFields({
      cvmIdList: phalaContext.cvmIdList,
    });
    return true;
  }
  await notMetHandler();
  return false;
}

function cloneResponses(formatResponse) {
  return JSON.parse(JSON.stringify(formatResponse));
}

function buildPatchedPhalaRequests(formatRequests) {
  const nextRequests = formatRequests.map((request) => ({ ...request }));
  if (nextRequests[0]) {
    nextRequests[0] = {
      ...nextRequests[0],
      url: TRUE_REQUEST_URL_FOR_PHALA_ACCOUNT,
    };
  }
  return nextRequests;
}

function buildPatchedPhalaAccountResponses(formatResponse) {
  const nextResponse = cloneResponses(formatResponse);
  const firstSubcondition =
    nextResponse?.[0]?.conditions?.subconditions?.[0];
  if (firstSubcondition) {
    firstSubcondition.field = '$.email';
    firstSubcondition.reveal_id = 'email';
  }
  return nextResponse;
}

function buildPatchedReputationPhalaCvmListResponses(formatResponse, cvmIdList) {
  const nextResponse = cloneResponses(formatResponse);
  if (nextResponse?.[0]?.conditions?.subconditions) {
    nextResponse[0].conditions.subconditions[0] = buildPhalaEmailRevealCondition();
  }
  if (
    Array.isArray(cvmIdList) &&
    nextResponse?.[1]?.conditions?.subconditions
  ) {
    nextResponse[1].conditions.subconditions = cvmIdList.map((i, k) => ({
      field: `$.${i}.uptime`,
      op: 'REVEAL_STRING',
      type: 'FIELD_REVEAL',
      reveal_id: `cvm${k + 1}`,
    }));
  }
  return nextResponse;
}

function buildPatchedPhalaFormatParams(formatRequests, formatResponse, activeTemplate) {
  if (!Array.isArray(formatRequests) || !Array.isArray(formatResponse)) {
    return null;
  }

  if (isPhalaAccountTemplate(activeTemplate)) {
    return {
      formatRequests: buildPatchedPhalaRequests(formatRequests),
      formatResponse: buildPatchedPhalaAccountResponses(formatResponse),
    };
  }

  if (isReputationPhalaCvmListTemplate(activeTemplate)) {
    return {
      formatRequests: buildPatchedPhalaRequests(formatRequests),
      formatResponse: buildPatchedReputationPhalaCvmListResponses(
        formatResponse,
        getPhalaFields().cvmIdList
      ),
    };
  }

  return null;
}

function buildPhalaEmailRevealCondition() {
  return {
    field: '$.email',
    op: 'REVEAL_STRING',
    type: 'FIELD_REVEAL',
    reveal_id: 'email',
  };
}

/**
 * Build patched formatRequests / formatResponse for Phala templates.
 */
export function getPatchedFormatParamsForSpecialTemplateReputationPhala(
  formatRequests,
  formatResponse,
  activeTemplate
) {
  return buildPatchedPhalaFormatParams(
    formatRequests,
    formatResponse,
    activeTemplate
  );
}
