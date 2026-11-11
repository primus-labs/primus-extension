/** Host-overlay hide rules apply only to these attestation templates. */

export const TEMPLATE_ID_HAILUO_CREATION =
  'b67a9894-f3b3-4fd2-ba32-0097e83d4514';

export const TEMPLATE_ID_DREAMINA = 'ed1c4ded-665e-41d3-a192-076f16e8d4e5';

const HOST_OVERLAY_TEMPLATE_IDS = new Set([
  TEMPLATE_ID_HAILUO_CREATION,
  TEMPLATE_ID_DREAMINA,
]);

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} templateParams
 * @returns {boolean}
 */
export function matchesHostOverlayHideTemplate(templateParams) {
  const raw =
    templateParams?.attTemplateID ??
    templateParams?.templateId ??
    templateParams?.id;
  if (raw == null || raw === '') {
    return false;
  }
  return HOST_OVERLAY_TEMPLATE_IDS.has(String(raw).trim().toLowerCase());
}

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} templateParams
 * @returns {string | null}
 */
export function normalizeHostOverlayTemplateId(templateParams) {
  const raw =
    templateParams?.attTemplateID ??
    templateParams?.templateId ??
    templateParams?.id;
  if (raw == null || raw === '') {
    return null;
  }
  const id = String(raw).trim().toLowerCase();
  return HOST_OVERLAY_TEMPLATE_IDS.has(id) ? id : null;
}
