import { matchesTemplateId } from './templateIdUtils.js';

/** GitHub interacted repositories list attestation */
export const TEMPLATE_ID = 'aa400fc2-5885-4576-83e8-8cb355846bd8';
export const displayName = 'GitHub repositories';

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {boolean}
 */
export function matches(activeTemplate) {
  return matchesTemplateId(activeTemplate, TEMPLATE_ID);
}
