import { reputationPhalaCvmListCheckTime } from '@/services/api/phala';
export const templateIdForPhalaAccount = '3630e4cc-9329-44c5-a4ed-25fbe5e195a3';
export const templateIdForReputaionPhalaCvmList =
  'efcce302-2405-4b4e-8920-952abec1f91e';
export const trueRequestUrlForPhalaAccount =
  'https://cloud-api.phala.network/api/v1/auth/me';
export const phalaCvmListRequestUrl =
  'https://cloud.phala.network/api/status/batch';

export let phalaFields = {};

export const changeFieldsObjFnForPhala = (op, key, value) => {
  if (op === 'delete') {
    delete phalaFields[key];
  } else if (op === 'add') {
    phalaFields[key] = value;
  } else if (op === 'update') {
    phalaFields[key] = value;
  } else if (op === 'reset') {
    phalaFields = {};
  }
};

export const formatRequestResponseFnForPhalaAccount = (
  formatRequests,
  formatResponse
) => {
  const newFormatRequests = JSON.parse(JSON.stringify(formatRequests));
  const newFormatResponse = JSON.parse(JSON.stringify(formatResponse));
  newFormatRequests[0].url = trueRequestUrlForPhalaAccount;
  newFormatResponse[0].conditions.subconditions[0].field = '$.email';
  newFormatResponse[0].conditions.subconditions[0].reveal_id = 'email';
  return {
    formatRequests: newFormatRequests,
    formatResponse: newFormatResponse,
  };
};
export const formatRequestResponseFnForReputationPhalaCvmList = (
  formatRequests,
  formatResponse
) => {
  const newFormatRequests = JSON.parse(JSON.stringify(formatRequests));
  const newFormatResponse = JSON.parse(JSON.stringify(formatResponse));
  newFormatRequests[0].url = trueRequestUrlForPhalaAccount;
  newFormatResponse[0].conditions.subconditions[0] = {
    field: '$.email',
    op: 'REVEAL_STRING',
    type: 'FIELD_REVEAL',
    reveal_id: 'email',
  };

  newFormatResponse[1].conditions.subconditions = phalaFields.cvmIdList.map(
    (i) => {
      return {
        field: `$.${i}.uptime`,
        op: 'REVEAL_STRING',
        type: 'FIELD_REVEAL',
        reveal_id: i,
      };
    }
  );
  return {
    formatRequests: newFormatRequests,
    formatResponse: newFormatResponse,
  };
};

export const reputationPhalaCvmListCheckTimeFn = async (cvmUpdateTimeArr) => {
  try {
    const { rc, result } = await reputationPhalaCvmListCheckTime(
      cvmUpdateTimeArr
    );
    if (rc === 0 && result) {
      return true;
    }
  } catch (e) {}
};
export const checkTargetRequestFnForReputationPhalaCvmList = async (
  matchRequestUrlResult,
  notMetHandler
) => {
  const metHandler = async (cvmIdList) => {
    changeFieldsObjFnForPhala('add', 'cvmIdList', cvmIdList);
  };
  changeFieldsObjFnForPhala('reset');
  if (matchRequestUrlResult) {
    const cvmIdArr = Object.keys(matchRequestUrlResult);
    const updateTimeArr = Object.values(matchRequestUrlResult).map(
      (i) => i.uptime
    );
    const reputationPhalaCvmListCheckTimeFnRes =
      await reputationPhalaCvmListCheckTimeFn(updateTimeArr);
    if (reputationPhalaCvmListCheckTimeFnRes) {
      metHandler(cvmIdArr);
      return true;
    } else {
      await notMetHandler();
    }
  } else {
    return false;
  }
};

// old reputation phala cvm zkvm
export const templateIdForPhalaCvmList = 'efcce302-2405-4b4e-8920-952abec1f91c';
export const formatRequestResponseFnForPhalaCvmList = (
  formatRequests,
  formatResponse
) => {
  const newFormatRequests = JSON.parse(JSON.stringify(formatRequests));
  const newFormatResponse = JSON.parse(JSON.stringify(formatResponse));
  newFormatRequests[0].url = trueRequestUrlForPhalaAccount;
  // newFormatResponse[0].conditions.subconditions[0].op = 'SHA256_EX';
  // newFormatResponse[0].conditions.subconditions[0].field = '$';
  // newFormatResponse[0].conditions.subconditions[0].reveal_id = 'email';

  newFormatResponse[0].conditions.subconditions[0] = {
    op: 'REVEAL_HEX_STRING',
    type: 'FIELD_REVEAL',
    field: { type: 'FIELD_ARITHMETIC', op: 'SHA256', field: '$' },
    reveal_id: 'userInfo',
  };
  const { reveal_id, field } = newFormatResponse[1].conditions.subconditions[0];
  newFormatResponse[1].conditions.subconditions[0] = {
    op: 'REVEAL_HEX_STRING',
    type: 'FIELD_REVEAL',
    field: { type: 'FIELD_ARITHMETIC', op: 'SHA256', field },
    reveal_id,
  };
  // newFormatResponse[0].conditions.subconditions[0].op = 'REVEAL_HEX_STRING';
  // newFormatResponse[0].conditions.subconditions[0].type = 'FIELD_REVEAL';
  // newFormatResponse[0].conditions.subconditions[0].field = '$';
  // newFormatResponse[0].conditions.subconditions[0].reveal_id = 'email';
  return {
    formatRequests: newFormatRequests,
    formatResponse: newFormatResponse,
  };
};
