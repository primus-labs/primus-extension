export const monadEventName = 'zkIgnite'; // TODO
export const monadTemplateId = 'be2268c1-56b2-438a-80cb-eddf2e850b63'; // TODO
export let monadFields = {};
export let monadEventListUrlFn = (url) => {
  return url.replace('pagination_limit=25', 'pagination_limit=1000');
};
export let monadProfileUrlFn = (userId) => {
  return `https://api.lu.ma/user/profile?username=${userId}`;
};
export const monadCalculations = {
  type: 'CONDITION_EXPANSION',
  op: '&',
  subconditions: [
    {
      type: 'RESPONSE_ID',
      id: 0,
    },
    {
      type: 'RESPONSE_ID',
      id: 1,
    },
  ],
};
