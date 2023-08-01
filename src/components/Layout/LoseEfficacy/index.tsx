import React, { memo, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import PMask from '@/components/PMask';
import iconInfoColorful from '@/assets/img/iconInfoColorful.svg';
import rightArrow from '@/assets/img/rightArrow.svg';

import { getServerTime } from '@/services/api/config';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';

import './index.sass';

const LoseEfficacyDialog = memo(() => {
  const dispatch: Dispatch<any> = useDispatch();
  const effective = useSelector((state: UserState) => state.effective);
  
  const onSubmit = () => {
    window.open('https://padolabs.org/');
  }
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
  
  
  return (
    <>
      {!effective && (
        <PMask onClose={() => {}} closeable={false}>
          <div className="padoDialog loseEfficacyDialog">
            <main>
              <img className="warnImg" src={iconInfoColorful} alt="" />
              <h1>Trial time has expired</h1>
              <h2>
                Please visit our website to access the latest products &
                services from PADO Labs.
              </h2>
            </main>
            <button className="nextBtn" onClick={onSubmit}>
              <span>Next</span>
              <img className="suffix" src={rightArrow} alt="" />
            </button>
          </div>
        </PMask>
      )}
    </>
  );
});

export default LoseEfficacyDialog;
