# Host overlay: hide PageDecode modal

While attestation runs on the data-source tab, hide `#pado-extension-content` when the host site shows a blocking overlay (React stays mounted; CSS `visibility: hidden`).

## Templates

| Template ID | Detect |
|-------------|--------|
| `b67a9894-f3b3-4fd2-ba32-0097e83d4514` (Hailuo) | Visible `section` with a class token containing `fixed` |
| `ed1c4ded-665e-41d3-a192-076f16e8d4e5` (Dreamina) | Visible `div` whose classes (combined) contain `modal`, `center`, and `zoomModal-enter-done` |

Visibility: connected, non-zero size, `display`/`visibility`/`pointer-events` not hiding interaction.

## Wiring

- [`poll.js`](poll.js) — `MutationObserver` + 2s fallback tick; debounced 150ms.
- [`index.jsx`](../index.jsx) — `hostOverlayHideModal` on `activeRequest`; same class as Polymarket profile hide.
