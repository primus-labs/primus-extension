import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDefaultRevealOpForResponseValueType,
  isStreamResponseValueType,
  responseTemplateIndicatesStream,
  STREAM_REVEAL_OP,
  STREAM_RESPONSE_VALUE_TYPE,
  DEFAULT_REVEAL_OP,
} from './streamTemplate.js';

describe('streamTemplate', () => {
  it('recognizes STREAM valueType case-insensitively', () => {
    assert.equal(isStreamResponseValueType('STREAM'), true);
    assert.equal(isStreamResponseValueType('stream'), true);
    assert.equal(isStreamResponseValueType('FIXED_VALUE'), false);
  });

  it('getDefaultRevealOpForResponseValueType maps STREAM to REVEAL_HEX_STRING', () => {
    assert.equal(getDefaultRevealOpForResponseValueType('STREAM'), STREAM_REVEAL_OP);
    assert.equal(getDefaultRevealOpForResponseValueType('FIXED_VALUE'), DEFAULT_REVEAL_OP);
    assert.equal(getDefaultRevealOpForResponseValueType(undefined), DEFAULT_REVEAL_OP);
  });

  it('responseTemplateIndicatesStream when any slot is STREAM', () => {
    assert.equal(responseTemplateIndicatesStream(null), false);
    assert.equal(
      responseTemplateIndicatesStream([
        { valueType: 'FIXED_VALUE', resolver: { expression: '$' } },
      ]),
      false
    );
    assert.equal(
      responseTemplateIndicatesStream([
        {
          valueType: STREAM_RESPONSE_VALUE_TYPE,
          resolver: { type: 'JSON_PATH', expression: '$' },
          feilds: [{ key: 'steam' }],
        },
      ]),
      true
    );
  });

  it('X JF original_content_rewards slot marks stream attestation + reveal op', () => {
    const xJfDataSourceSlot = {
      requestTemplate: {
        host: 'x.com',
        targetUrlExpression:
          'https://x.com/i/jfapi/creators/original_content_rewards',
        targetUrlType: 'REGX',
        method: 'GET',
        ignoreResponse: true,
        requireReplayValidation: true,
      },
      responseTemplate: [
        {
          resolver: { type: 'JSON_PATH', expression: '$' },
          valueType: 'STREAM',
          feilds: [{ key: 'steam' }],
        },
      ],
    };
    assert.equal(
      responseTemplateIndicatesStream(xJfDataSourceSlot.responseTemplate),
      true
    );
    const requests = [
      {
        url: xJfDataSourceSlot.requestTemplate.targetUrlExpression,
        isStream: true,
      },
    ];
    const algorithmParams = {};
    if (requests.some((r) => r.isStream === true)) {
      algorithmParams.stream = true;
    }
    assert.equal(algorithmParams.stream, true);
    assert.equal(
      getDefaultRevealOpForResponseValueType(
        xJfDataSourceSlot.responseTemplate[0].valueType
      ),
      'REVEAL_HEX_STRING'
    );
  });
});
