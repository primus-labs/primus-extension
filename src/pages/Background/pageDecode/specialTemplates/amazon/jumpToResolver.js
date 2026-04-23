import { getPageDecodeState } from '../../state';
import { rewriteUrlOrigin } from '../../urlOriginRewrite';
import { getAmazonSiteByIP } from './geoResolver';
import { shouldHandleAmazonTemplate } from './guard';

export async function applyAmazonSiteJumpToIfNeeded(
  activeTemplate,
  browserTabId
) {
  if (!shouldHandleAmazonTemplate(activeTemplate)) return;

  const amazonBase = await getAmazonSiteByIP(browserTabId);
  getPageDecodeState().state.resolvedAmazonStorefrontBaseUrl = amazonBase;

  const jumpTo = activeTemplate?.jumpTo;
  if (typeof jumpTo !== 'string' || !jumpTo.trim()) return;

  activeTemplate.jumpTo = rewriteUrlOrigin(jumpTo, amazonBase);
}
