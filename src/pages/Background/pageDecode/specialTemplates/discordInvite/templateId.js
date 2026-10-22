/** Discord invite template identity. */
import { matchesTemplateId } from '../templateIdUtils.js';

export const TEMPLATE_ID = '9c7c58d1-90bb-4311-b17a-b9ada8e3299e';
export const displayName = 'Discord invite';

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {boolean}
 */
export function matches(activeTemplate) {
  return matchesTemplateId(activeTemplate, TEMPLATE_ID);
}

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {boolean}
 */
export function shouldDeferModalUntilFirstCapture(activeTemplate) {
  return matches(activeTemplate);
}
