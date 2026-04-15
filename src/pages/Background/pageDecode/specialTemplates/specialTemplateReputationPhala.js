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

export const templateIdForReputaionPhalaCvmList =
  TEMPLATE_ID_FOR_REPUTATION_PHALA_CVM_LIST;

export const templateIdForPhalaAccount = TEMPLATE_ID_FOR_PHALA_ACCOUNT;

export const TRUE_REQUEST_URL_FOR_PHALA_ACCOUNT =
  'https://cloud-api.phala.com/api/v1/auth/me';
// export const TRUE_REQUEST_URL_FOR_PHALA_ACCOUNT =
//  " https://gateway.mava.app/sdk/identify"

export const PHALA_CVM_LIST_BATCH_STATUS_URL =
  'https://cloud.phala.com/api/status/batch';


function getPhalaFields() {
  return getPageDecodeState().state.reputationPhalaFields;
}

function changePhalaField(op, key, value) {
  const fields = getPhalaFields();
  if (op === 'reset') {
    Object.keys(fields).forEach((k) => {
      delete fields[k];
    });
    return;
  }
  if (op === 'delete') {
    delete fields[key];
  } else if (op === 'add' || op === 'update') {
    fields[key] = value;
  }
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

export async function checkTargetRequestFnForReputationPhalaCvmList(
  matchRequestUrlResult,
  notMetHandler
) {
  changePhalaField('reset');
  if (!matchRequestUrlResult) {
    return false;
  }
  const cvmIdArr = Object.keys(matchRequestUrlResult);
  const updateTimeArr = Object.values(matchRequestUrlResult).map(
    (i) => i.uptime
  );
  const ok = await reputationPhalaCvmListCheckTimeFn(updateTimeArr);
  if (ok) {
    changePhalaField('add', 'cvmIdList', cvmIdArr);
    return true;
  }
  await notMetHandler();
  return false;
}

function patchPhalaAccount(formatRequests, formatResponse) {
  formatRequests[0].url = TRUE_REQUEST_URL_FOR_PHALA_ACCOUNT;
  formatResponse[0].conditions.subconditions[0].field = '$.email';
  // formatResponse[0].conditions.subconditions[0].field = '$.emailAddress';
  formatResponse[0].conditions.subconditions[0].reveal_id = 'email';
}

function patchReputationPhalaCvmList(formatRequests, formatResponse) {
  formatRequests[0].url = TRUE_REQUEST_URL_FOR_PHALA_ACCOUNT;
  formatResponse[0].conditions.subconditions[0] = {
    field: '$.email',
    op: 'REVEAL_STRING',
    type: 'FIELD_REVEAL',
    reveal_id: 'email',
  };
  const cvmIdList = getPhalaFields().cvmIdList;
  if (!Array.isArray(cvmIdList)) {
    return;
  }
  formatResponse[1].conditions.subconditions = cvmIdList.map((i, k) => ({
    field: `$.${i}.uptime`,
    op: 'REVEAL_STRING',
    type: 'FIELD_REVEAL',
    reveal_id: `cvm${k + 1}`,
  }));
}

/**
 * Mutate algorithm formatRequests / formatResponse for Phala templates (before Object.assign into SDK params).
 */
export function tryPatchFormatRequestsAndResponseForSpecialTemplateReputationPhala(
  formatRequests,
  formatResponse,
  activeTemplate
) {
  if (!Array.isArray(formatRequests) || !Array.isArray(formatResponse)) {
    return;
  }
  if (isPhalaAccountTemplate(activeTemplate)) {
    patchPhalaAccount(formatRequests, formatResponse);
    return;
  }
  if (isReputationPhalaCvmListTemplate(activeTemplate)) {
    patchReputationPhalaCvmList(formatRequests, formatResponse);
  }
}
