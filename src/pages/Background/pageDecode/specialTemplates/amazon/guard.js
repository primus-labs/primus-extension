import { trimValidJumpUrlBase } from '../../additionParamsJumpUrl';
import { AMAZON_ACCOUNT_MANAGE_TEMPLATE_ID } from './constants';

function getActiveTemplateId(activeTemplate) {
  return activeTemplate?.attTemplateID ?? activeTemplate?.id;
}

export function isAmazonAccountManageTemplate(activeTemplate) {
  return getActiveTemplateId(activeTemplate) === AMAZON_ACCOUNT_MANAGE_TEMPLATE_ID;
}

export function hasAmazonJumpToOverride(activeTemplate) {
  return !!trimValidJumpUrlBase(activeTemplate?.additionParamsObj?.jumpToUrl ?? '');
}

export function shouldHandleAmazonTemplate(activeTemplate) {
  return (
    isAmazonAccountManageTemplate(activeTemplate) &&
    !hasAmazonJumpToOverride(activeTemplate)
  );
}
