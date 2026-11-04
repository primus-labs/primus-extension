import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TEMPLATE_ID,
  matches,
  describeUrlMatchForRequests,
} from './specialTemplateGithubHome.js';

describe('GitHub home template debug helpers', () => {
  it('matches template id', () => {
    assert.equal(
      matches({ attTemplateID: TEMPLATE_ID }),
      true
    );
    assert.equal(matches({ attTemplateID: 'other' }), false);
  });

  it('describeUrlMatchForRequests applies REGX slot', () => {
    const requests = [
      {
        url: '^https://github.com/$',
        urlType: 'REGX',
        method: 'GET',
        needCapture: true,
      },
    ];
    assert.deepEqual(
      describeUrlMatchForRequests('https://github.com/', requests),
      [{ slot: 0, requiredUrl: '^https://github.com/$', urlType: 'REGX', method: 'GET', matched: true }]
    );
    assert.notEqual(
      describeUrlMatchForRequests('https://github.com', requests)[0].matched,
      true
    );
  });
});
