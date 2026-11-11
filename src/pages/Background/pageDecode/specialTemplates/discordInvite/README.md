# Discord invite (`9c7c58d1-90bb-4311-b17a-b9ada8e3299e`)

## Special behavior

1. **Deferred verification modal** — Do not mount the page-decode card until the first `datasourceTemplate.requests` URL match is stored (`firstTemplateRequestCaptured`).
2. **Account popout clicks** — While requests are not fully ready, poll and click visible account UI targets whose class names start with `accountPopoutButtonWrapper`, `accountPopoutButton`, `wrapper`+`avatar`, or `nameTag` (Discord hashed modules, e.g. `*_g6VwXp`) in the page MAIN world. Clicks the matched element directly (not limited to `<button>`).

## Wiring

| Module | Hook |
|--------|------|
| `messageHandler.js` | `startDiscordAccountClick` / `stopDiscordAccountClick` on init, close, tab removed |
| `requestInterceptor.js` | `markFirstConfiguredRequestCapturedIfNeeded` after template URL capture |
| `content/pageDecode/index.jsx` | `shouldDeferModalUntilFirstCapture`, `firstTemplateRequestCaptured` message |

## Files

- `templateId.js` — identity and defer-modal gate
- `accountClick.js` — click polling
- `firstCaptureModal.js` — first-capture notification to content script
