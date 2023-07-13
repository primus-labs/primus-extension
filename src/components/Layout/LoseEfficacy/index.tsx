import React, { memo, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import PMask from '@/components/PMask';
import ClaimDialogHeaderDialog from '@/components/Events/ClaimWrapper/ClaimDialogHeader';

import { getServerTime } from '@/services/api/config';
import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';

import './index.sass';

const LoseEfficacyDialog = memo(() => {
  const dispatch: Dispatch<any> = useDispatch();
  const effective = useSelector((state: UserState) => state.effective);

  const checkIsEffective = useCallback(async () => {
    try {
      const { rc, result } = await getServerTime();
      if (rc === 0) {
        const curTime = +new Date(result - 0);
        const expireTime = +new Date('2023/08/17 23:59');
        dispatch({
          type: 'setEffective',
          payload: curTime <= expireTime,
        });
      }
    } catch {
      alert('getServerTime network error!');
    }
  }, [dispatch]);
  useEffect(() => {
    checkIsEffective();
  }, [checkIsEffective]);
  return (
    <>
      {!effective && (
        <PMask onClose={() => {}} closeable={false}>
          <div className="padoDialog loseEfficacyDialog">
            <main>
              <ClaimDialogHeaderDialog title="PADO Tip" />
              <h1>The installation package has expired</h1>
            </main>
          </div>
        </PMask>
      )}
    </>
  );
});

export default LoseEfficacyDialog;
