export const TEMPLATE_ID_FOR_LUMA_PAGED_APPROVED =
  '52167341-a507-4bd3-804f-9fcb105cbeeb';

/**
 * Chains K list-response proofs (variable length vs fixed Monad pair).
 */
export function buildPagedApprovedCalculations(k) {
  if (!Number.isFinite(k) || k <= 0) {
    return undefined;
  }
  return {
    type: 'CONDITION_EXPANSION',
    op: '&',
    subconditions: Array.from({ length: k }, (_, id) => ({
      type: 'RESPONSE_ID',
      id,
    })),
  };
}
