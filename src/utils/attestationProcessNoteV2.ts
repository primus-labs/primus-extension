/**
 * ATTESTATION_PROCESS_NOTE_V2: { [code]: { sdk, extension } } from system config.
 * Merges bundled defaults (errorConfig.json) with server JSON; server wins.
 */
import defaultNoteV2 from '@/config/errorConfig.json';
import { safeJsonParse } from '@/utils/utils';

export type AttestationNoteV2Entry = { sdk?: string; extension?: string };

export type AttestationNoteV2Map = Record<string, AttestationNoteV2Entry>;

/**
 * User-facing string for the data-source tab popup (.extension).
 * Empty or missing extension falls back to avoid blank UI.
 */
export function getNoteV2Extension(
  noteV2Map: AttestationNoteV2Map | null | undefined,
  code: string | number | null | undefined,
  fallback: string
): string {
  if (!noteV2Map || code == null) return fallback;
  const key = String(code);
  const ext = noteV2Map[key]?.extension;
  if (ext != null && ext !== '') return ext;
  return fallback;
}

/**
 * Parse ATTESTATION_PROCESS_NOTE_V2 from flattened config map and merge with local defaults.
 */
export function resolveNoteV2MapFromConfigParsed(
  configMapParsed: Record<string, unknown> | null | undefined
): AttestationNoteV2Map {
  const raw = configMapParsed?.ATTESTATION_PROCESS_NOTE_V2;
  const parsed =
    typeof raw === 'string' && raw !== ''
      ? safeJsonParse<AttestationNoteV2Map>(raw, null)
      : null;
  const server =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  return {
    ...(defaultNoteV2 as AttestationNoteV2Map),
    ...server,
  };
}
