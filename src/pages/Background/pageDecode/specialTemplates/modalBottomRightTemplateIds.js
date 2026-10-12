/**
 * Templates whose page-decode modal is anchored to the bottom-right of the viewport
 * (instead of centered). Used on host pages with large centered overlays (e.g. login).
 */

export const MODAL_BOTTOM_RIGHT_TEMPLATE_IDS = [
  '9a93aeeb-99b0-4d5e-a49a-e71c7ddbd5bd',
];

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeRequest
 * @returns {boolean}
 */
export function shouldUseBottomRightModalForTemplate(activeRequest) {
  const raw =
    activeRequest?.attTemplateID ??
    activeRequest?.templateId ??
    activeRequest?.id;
  if (raw == null || raw === '') return false;
  const normalized = String(raw).trim().toLowerCase();
  return MODAL_BOTTOM_RIGHT_TEMPLATE_IDS.some(
    (id) => id.toLowerCase() === normalized
  );
}
