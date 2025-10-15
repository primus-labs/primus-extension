import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { UserState } from '@/types/store';
import PButton from '@/newComponents/PButton';
import './index.scss';

const Banner: React.FC = () => {
  const sysConfig = useSelector((state: UserState) => state.sysConfig);

  const hubUrl = useMemo(() => {
    const configStr =
      sysConfig.REPUTATIONRECORD_LINK || 'http://app.primuslabs.xyz';
    return configStr;
  }, [sysConfig]);
  const handleStart = useCallback(() => {
    window.open(hubUrl);
  }, [hubUrl]);
  return (
    <div className="dataSourceBanner">
      <div className="intro">
        <i className="iconfont icon-iconInfoColorful" />
        <div className="txtWrapper">
          <div className="title">
            Primus AlphaNet is live — join the new journey!
          </div>
          <div className="desc">
            <p>All your extension points are counted.</p>
          </div>
        </div>
      </div>
      <PButton
        className="startBtn"
        text="Join now"
        type="secondary"
        size="s"
        onClick={handleStart}
      />
    </div>
  );
};

export default Banner;
