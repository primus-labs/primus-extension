import { matchesTemplateId } from '../templateIdUtils.js';

export const TEMPLATE_ID = 'b9c13528-7cd2-4fd7-b490-00885b968d70';
export const displayName = 'GitHub organizations (partial ready)';

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {boolean}
 */
export function matches(activeTemplate) {
  return matchesTemplateId(activeTemplate, TEMPLATE_ID);
}
