import { matchesTemplateId } from './templateIdUtils.js';

export const TEMPLATE_ID = '0a6a0c38-c02b-4d48-9084-7b262750b9ae';
export const displayName = 'fomo';

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {boolean}
 */
export function matches(activeTemplate) {
  return matchesTemplateId(activeTemplate, TEMPLATE_ID);
}

export const hooks = {
  pageDecodeModal: { darkTheme: true, placement: 'center' },
  jsonPath: { truncateAtEmptyArray: false },
};
