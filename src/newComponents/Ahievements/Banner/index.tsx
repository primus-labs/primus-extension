import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { UserState } from '@/types/store';
import PButton from '@/newComponents/PButton';
import './index.scss';

const Banner: React.FC = () => {
  const sysConfig = useSelector((state: UserState) => state.sysConfig);
  const configTextObj = useMemo(() => {
    const configStr = sysConfig.REPUTATIONRECORD_SHOWTEXT;
    if (configStr) {
      return JSON.parse(configStr);
    } else {
      return {
        title: 'Primus AlphaNet is live — join the new journey!',
        desc: 'All your extension points are counted.',
      };
    }
  }, [sysConfig]);
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
          <div className="title">{configTextObj?.title}</div>
          <div className="desc">
            <p>{configTextObj?.desc}</p>
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
