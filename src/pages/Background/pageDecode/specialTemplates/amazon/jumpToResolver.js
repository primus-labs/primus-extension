import { getPageDecodeState } from '../../state';
import { resolveAmazonSite } from './geoResolver';
import { shouldHandleAmazonTemplate } from './guard';

export async function applyAmazonSiteJumpToIfNeeded(
  activeTemplate,
  browserTabId
) {
  if (!shouldHandleAmazonTemplate(activeTemplate)) return;

  const amazonSite = await resolveAmazonSite(
    browserTabId,
    activeTemplate?.additionParamsObj?.jumpToUrl
  );
  getPageDecodeState().state.resolvedAmazonStorefrontBaseUrl =
    amazonSite.storefrontUrl;

  // New Amazon flow: discard the template/override path and query, then use
  // the selected site's canonical cnep URL with its fixed assoc_handle.
  activeTemplate.jumpTo = amazonSite.cnepUrl;
}
