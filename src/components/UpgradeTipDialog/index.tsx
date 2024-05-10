import React, { memo, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import PMask from '@/components/PMask';
import iconInfoColorful from '@/assets/img/iconInfoColorful.svg';
import type { UserState } from '@/types/store';

import './index.sass';

const UpgradeTipDialog = memo(() => {
  const sysConfig = useSelector((state: UserState) => state.sysConfig);
  const requireUpgrade = useSelector(
    (state: UserState) => state.requireUpgrade
  );
  const onSubmit = () => {
    window.open(
      'https://chrome.google.com/webstore/detail/pado/oeiomhmbaapihbilkfkhmlajkeegnjhe'
    );
  };
 
 
  return (
    <>
      {requireUpgrade && (
        <PMask onClose={() => {}} closeable={false}>
          <div className="padoDialog upgradeTipDialog">
            <main>
              <img className="warnImg" src={iconInfoColorful} alt="" />
              <h1>Time to update!</h1>
              <h2>
                We've made a whole new UI & UX to make your experience as smooth
                as possible. Please update to the latest{' '}
                {sysConfig.LATEST_SUPPORTED_VERSION} version.
              </h2>
            </main>
            <button className="nextBtn" onClick={onSubmit}>
              <span>Update</span>
            </button>
          </div>
        </PMask>
      )}
    </>
  );
});

export default UpgradeTipDialog;
