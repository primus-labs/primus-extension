# GitHub organizations partial ready (`b9c13528-7cd2-4fd7-b490-00885b968d70`)

## Special behavior

From **data-source tab open**, start a **60s** timer. When it fires:

- If **all** `needCapture` requests have `isTarget === 1` → normal full ready (via `checkWebRequestIsReady`).
- If **some but not all** have `isTarget === 1` → partial ready: set `partialCaptureIndices`, build algorithm params with only those request/response pairs, then `webRequestIsReady`.
- If **none** have `isTarget === 1` → no action (generic timeouts apply).

Example: only `settings/organizations` captured, not `_side-panels/user.json` → proof runs with the organizations pair only.

## Wiring

| Module | Hook |
|--------|------|
| `messageHandler.js` | `armPartialReadyTimer` / `clearPartialReadyTimer` on init, close, tab removed |
| `requestInterceptor.js` | clear timer + `partialCaptureIndices = null` on full ready |
| `templateMatcher.js` | skip/filter by `partialCaptureIndices` when `isPartialCaptureActive` |

## Files

- `templateId.js` — identity
- `partialReady60s.js` — timer and partial ready flow
