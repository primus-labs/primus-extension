import { matchesTemplateId } from './templateIdUtils.js';

export const TEMPLATE_ID = '801a0cae-c21d-4063-91c6-fb58687c9d30';
export const displayName = 'Hyperliquid';

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {boolean}
 */
export function matches(activeTemplate) {
  return matchesTemplateId(activeTemplate, TEMPLATE_ID);
}

export const hooks = {
  pageDecodeModal: { darkTheme: true, bottomRight: false },
  jsonPath: { truncateAtEmptyArray: true },
};
