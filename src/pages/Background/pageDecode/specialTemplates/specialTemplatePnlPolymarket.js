import { matchesTemplateId } from './templateIdUtils.js';

export const TEMPLATE_ID = '9a93aeeb-99b0-4d5e-a49a-e71c7ddbd5bd';
export const displayName = 'Polymarket';

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {boolean}
 */
export function matches(activeTemplate) {
  return matchesTemplateId(activeTemplate, TEMPLATE_ID);
}

export const hooks = {
  pageDecodeModal: { darkTheme: false, bottomRight: true },
  jsonPath: { truncateAtEmptyArray: true },
};
