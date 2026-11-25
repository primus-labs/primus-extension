// src/pages/Background/padoZKAttestationJSSDK/algorithmInitialization.js

/**
 * Ensures the offscreen algorithm document exists and refreshes an existing
 * document for the active SDK client when requested.
 */
export async function ensureAlgorithmDocument(options) {
  const documentExists = await options.hasDocument();
  if (!documentExists) {
    await options.createDocument();
    return { created: true, initialized: false };
  }

  if (options.ensureInitialization) {
    await options.initializeExisting();
  }
  return {
    created: false,
    initialized: Boolean(options.ensureInitialization),
  };
}
