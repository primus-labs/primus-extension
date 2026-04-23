import {
  getTrueRequestHostname,
  rewriteRequestUrlsToTrueOrigin,
} from '../../requestHostOverride';
import { shouldHandleAmazonTemplate } from './guard';

export function getAmazonHostOverrideForAlgorithmParams(
  activeTemplate,
  formatRequests
) {
  if (!shouldHandleAmazonTemplate(activeTemplate)) return null;
  return getTrueRequestHostname(formatRequests);
}

export function rewriteAmazonRequestUrlsForAlgorithmParams(
  formatRequests,
  activeTemplate
) {
  if (!shouldHandleAmazonTemplate(activeTemplate)) return null;
  return rewriteRequestUrlsToTrueOrigin(formatRequests);
}
