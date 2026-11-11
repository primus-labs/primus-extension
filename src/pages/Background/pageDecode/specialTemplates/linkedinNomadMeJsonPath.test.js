import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jp from 'jsonpath';

const PUBLIC_ID_PATH =
  '$.included[?(@.publicIdentifier && @.occupation)].publicIdentifier';
const OCCUPATION_PATH =
  '$.included[?(@.publicIdentifier && @.occupation)].occupation';

const jsonPathArr = [PUBLIC_ID_PATH, OCCUPATION_PATH];

function mePathsMatch(body) {
  return jsonPathArr.every((path) => jp.query(body, path).length > 0);
}

describe('LinkedIn /me included semantic JSONPath', () => {
  it('passes when miniProfile is not at index 0', () => {
    const body = {
      included: [
        { $type: 'com.linkedin.voyager.dash.feed.Nav' },
        {
          publicIdentifier: 'test-user',
          occupation: 'Engineer at Acme',
        },
      ],
    };
    assert.equal(mePathsMatch(body), true);
  });

  it('fails when handle and occupation are on different included objects', () => {
    const body = {
      included: [
        { publicIdentifier: 'test-user' },
        { occupation: 'Engineer at Acme' },
      ],
    };
    assert.equal(mePathsMatch(body), false);
  });

  it('fails when occupation missing', () => {
    const body = {
      included: [{ publicIdentifier: 'test-user' }],
    };
    assert.equal(mePathsMatch(body), false);
  });
});
