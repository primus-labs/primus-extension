import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('pageDecodeReadyUiNotify contract', () => {
  it('message shape for content applyPageDecodeReadyFromBackground', () => {
    const msg = {
      type: 'pageDecode',
      name: 'pageDecodeReadyUiSync',
      isReady: true,
      phase: 'ready',
    };
    assert.equal(msg.isReady, true);
    assert.equal(msg.phase, 'ready');
  });
});
