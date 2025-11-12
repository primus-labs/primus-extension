export const templateIdForPhalaAccount = '3630e4cc-9329-44c5-a4ed-25fbe5e195a3';
export const templateIdForPhalaCvmList = 'efcce302-2405-4b4e-8920-952abec1f91c';
export const trueRequestUrlForPhalaAccount =
  'https://cloud-api.phala.network/api/v1/auth/me';
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
