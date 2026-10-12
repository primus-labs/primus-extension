/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @returns {string | null}
 */
export function normalizeTemplateId(activeTemplate) {
  const raw =
    activeTemplate?.attTemplateID ??
    activeTemplate?.templateId ??
    activeTemplate?.id;
  if (raw == null || raw === '') {
    return null;
  }
  return String(raw).trim().toLowerCase();
}

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} activeTemplate
 * @param {string} templateId
 * @returns {boolean}
 */
export function matchesTemplateId(activeTemplate, templateId) {
  const normalized = normalizeTemplateId(activeTemplate);
  if (!normalized) {
    return false;
  }
  return normalized === String(templateId).trim().toLowerCase();
}
