import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {
  collectXPathExpressionsForHtmlValidation,
  validateHtmlResponseCondition,
} from '../htmlXPathValidation.js';

const require = createRequire(import.meta.url);
const { validateXPathWithLibs } = require('../htmlXPathValidationCore.cjs');

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(
  __dirname,
  '../../../../../myDocs/templates/linkedin'
);

const PRIMARY_LOCATION_XPATH =
  '//section/div/div/div/div[2]//p[contains(@class,"gpp") and contains(@class,"ljc")][1]';

const ROLLBACK_LOCATION_XPATH =
  '//div/div/section/div/div/div/div[2]/div[1]/div[1]/div/div[2]/p[1]';

const fieldRevealSubconditions = [
  {
    field: PRIMARY_LOCATION_XPATH,
    op: 'EXISTS',
    type: 'string',
  },
];

function loadFixture(name) {
  return readFileSync(join(FIXTURE_DIR, name), 'utf8');
}

describe('LinkedIn location XPath on fixtures', () => {
  it('primary XPath has exactly one match on so.html and mw.html', () => {
    for (const file of ['so.html', 'mw.html']) {
      const html = loadFixture(file);
      const values = validateXPathWithLibs(html, PRIMARY_LOCATION_XPATH);
      assert.equal(values.length, 1, `${file} match count`);
      assert.match(values[0], /China/i, `${file} location text`);
    }
  });

  it('rollback structural XPath still resolves on fixtures', () => {
    for (const file of ['so.html', 'mw.html']) {
      const html = loadFixture(file);
      const values = validateXPathWithLibs(html, ROLLBACK_LOCATION_XPATH);
      assert.equal(values.length, 1, `${file} rollback count`);
    }
  });

  it('validateHtmlResponseCondition resolves FIELD_REVEAL objects', () => {
    const xpaths = collectXPathExpressionsForHtmlValidation(
      fieldRevealSubconditions
    );
    assert.deepEqual(xpaths, [PRIMARY_LOCATION_XPATH]);
    const html = loadFixture('so.html');
    assert.equal(
      validateHtmlResponseCondition(fieldRevealSubconditions, html),
      true
    );
  });
});
