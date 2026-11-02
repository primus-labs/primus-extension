import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractJumpParams,
  assembleJumpUrl,
  jumpConfigRequireParamsSatisfied,
  jumpConfigAllStepsComplete,
} from './jumpConfigRedirectPure.js';

describe('jumpConfigRedirect helpers', () => {
  it('extractJumpParams reads responseObject.userHandle', () => {
    const body = {
      success: true,
      responseObject: { userHandle: 'ArmedUrbanMacaw' },
    };
    const params = extractJumpParams(
      body,
      [
        {
          paramKey: 'userHandle',
          jsonPath: '$.responseObject.userHandle',
          defaultValue: '',
        },
      ],
      {}
    );
    assert.equal(params.userHandle, 'ArmedUrbanMacaw');
  });

  it('assembleJumpUrl path mode builds Fomo profile URL', () => {
    const url = assembleJumpUrl(
      {
        baseUrl: 'https://fomo.family/profile/{userHandle}',
        paramMode: 'path',
        params: [
          { key: 'userHandle', valueType: 'dynamic', value: 'userHandle' },
        ],
      },
      { userHandle: 'ArmedUrbanMacaw' },
      '',
      ''
    );
    assert.equal(url, 'https://fomo.family/profile/ArmedUrbanMacaw');
  });

  it('jumpConfigAllStepsComplete sequential uses currentStepIndex', () => {
    const steps = [{ stepId: 'a' }, { stepId: 'b' }];
    assert.equal(
      jumpConfigAllStepsComplete({
        stepOrder: 'sequential',
        steps,
        currentStepIndex: 1,
        completedStepKeys: new Set(['a']),
      }),
      false
    );
    assert.equal(
      jumpConfigAllStepsComplete({
        stepOrder: 'sequential',
        steps,
        currentStepIndex: 2,
        completedStepKeys: new Set(['a', 'b']),
      }),
      true
    );
  });

  it('jumpConfigAllStepsComplete any uses completedStepKeys only', () => {
    const steps = [{ stepId: 'userHandle' }, { stepId: 'referralObserved' }];
    assert.equal(
      jumpConfigAllStepsComplete({
        stepOrder: 'any',
        steps,
        currentStepIndex: 0,
        completedStepKeys: new Set(['referralObserved']),
      }),
      false
    );
    assert.equal(
      jumpConfigAllStepsComplete({
        stepOrder: 'any',
        steps,
        currentStepIndex: 0,
        completedStepKeys: new Set(['userHandle', 'referralObserved']),
      }),
      true
    );
  });

  it('jumpConfigRequireParamsSatisfied blocks empty userHandle', () => {
    assert.equal(
      jumpConfigRequireParamsSatisfied(['userHandle'], { userHandle: '' }),
      false
    );
    assert.equal(
      jumpConfigRequireParamsSatisfied(['userHandle'], {
        userHandle: 'ArmedUrbanMacaw',
      }),
      true
    );
  });
});
