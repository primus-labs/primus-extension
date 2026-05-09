export const TEMPLATE_ID_FOR_LUMA_PAGED_APPROVED =
  '52167341-a507-4bd3-804f-9fcb105cbeeb';

/**
 * Chains response proofs by RESPONSE_ID order: paginated hits first (0..pages-1), then tails.
 */
export function buildPagedApprovedCalculations(totalResponseCount) {
  if (!Number.isFinite(totalResponseCount) || totalResponseCount <= 0) {
    return undefined;
  }
  return {
    type: 'CONDITION_EXPANSION',
    op: '&',
    subconditions: Array.from({ length: totalResponseCount }, (_, id) => ({
      type: 'RESPONSE_ID',
      id,
    })),
  };
}
