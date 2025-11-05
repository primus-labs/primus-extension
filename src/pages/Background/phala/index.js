export const templateIdForPhalaAccount = '3630e4cc-9329-44c5-a4ed-25fbe5e195a3';
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
