import { AMAZON_ACCOUNT_MANAGE_TEMPLATE_ID } from './constants';

function getActiveTemplateId(activeTemplate) {
  return activeTemplate?.attTemplateID ?? activeTemplate?.id;
}

export function isAmazonAccountManageTemplate(activeTemplate) {
  return getActiveTemplateId(activeTemplate) === AMAZON_ACCOUNT_MANAGE_TEMPLATE_ID;
}

export function shouldHandleAmazonTemplate(activeTemplate) {
  return isAmazonAccountManageTemplate(activeTemplate);
}
