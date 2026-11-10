/**
 * @param {{ hailuoCreationEmptyFeedsMode?: boolean; hailuoIdentityLookupRequestId?: string | null }} state
 */
export function resetHailuoCreationEmptyFeedsMode(state) {
  if (!state || typeof state !== 'object') {
    return;
  }
  state.hailuoCreationEmptyFeedsMode = false;
  state.hailuoIdentityLookupRequestId = null;
}

/**
 * @param {{ hailuoCreationEmptyFeedsMode?: boolean; hailuoIdentityLookupRequestId?: string | null }} state
 * @param {{ requestId: string } | null} identityCapture
 */
export function setHailuoCreationEmptyFeedsMode(state, identityCapture) {
  if (!state || typeof state !== 'object') {
    return;
  }
  state.hailuoCreationEmptyFeedsMode = true;
  state.hailuoIdentityLookupRequestId = identityCapture?.requestId ?? null;
}
