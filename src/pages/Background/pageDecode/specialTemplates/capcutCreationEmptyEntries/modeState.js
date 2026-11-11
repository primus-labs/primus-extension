/**
 * @param {{ capcutCreationEmptyEntriesMode?: boolean; capcutEverPhotoTokenRequestId?: string | null }} state
 */
export function resetCapcutCreationEmptyEntriesMode(state) {
  if (!state || typeof state !== 'object') {
    return;
  }
  state.capcutCreationEmptyEntriesMode = false;
  state.capcutEverPhotoTokenRequestId = null;
}

/**
 * @param {{ capcutCreationEmptyEntriesMode?: boolean; capcutEverPhotoTokenRequestId?: string | null }} state
 * @param {{ requestId: string } | null} tokenCapture
 */
export function setCapcutCreationEmptyEntriesMode(state, tokenCapture) {
  if (!state || typeof state !== 'object') {
    return;
  }
  state.capcutCreationEmptyEntriesMode = true;
  state.capcutEverPhotoTokenRequestId = tokenCapture?.requestId ?? null;
}
