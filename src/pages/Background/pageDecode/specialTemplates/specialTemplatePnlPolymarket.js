import { matchesTemplateId } from './templateIdUtils.js';

export const TEMPLATE_ID = '9a93aeeb-99b0-4d5e-a49a-e71c7ddbd5bd';
export const displayName = 'Polymarket';

/**
 * Polymarket login uses a large centered Radix dialog; anchor the extension card
 * to the dialog's right edge (see hostModalAnchor in content script).
 *
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {boolean}
 */
export function matches(activeTemplate) {
  return matchesTemplateId(activeTemplate, TEMPLATE_ID);
}

export const hooks = {
  pageDecodeModal: {
    darkTheme: false,
    placement: 'center',
    // hostModalAnchor: {
    //   gap: 16,
    //   selectors: [
    //     '[role="dialog"][data-state="open"][data-slot="modal-content"]',
    //     '[role="dialog"][data-state="open"]',
    //   ],
    //   matchText: ['欢迎来到 Polymarket', 'Welcome to Polymarket'],
    // },
  },
  jsonPath: { truncateAtEmptyArray: true },
};
