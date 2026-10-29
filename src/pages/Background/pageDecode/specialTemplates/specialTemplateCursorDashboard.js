import { matchesTemplateId } from './templateIdUtils.js';

export const TEMPLATE_ID = '21fe8864-4059-42a2-af78-73dedf01b2ba';
export const displayName = 'Cursor dashboard daily spend';

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {boolean}
 */
export function matches(activeTemplate) {
  return matchesTemplateId(activeTemplate, TEMPLATE_ID);
}

export const hooks = {
  jsonPath: { truncateUnreachable: true },
};
