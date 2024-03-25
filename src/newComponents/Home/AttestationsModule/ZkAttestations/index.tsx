import React, { memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveConnectDataSource } from '@/store/actions';
import useAttestationsStatistics from '@/hooks/useAttestationsStatistics';
import './index.scss';
import ModuleStatistics from '../../ModuleStatistics';
const Overview = memo(() => {
  const { attestationsOnChainLen, attestationsOnChainIconList } =
    useAttestationsStatistics();

  return (
    <div className="homeZkattestations">
      <div className="title">
        <span>zkAttestations</span>
      </div>
      <div className="content">
        <div className="top">
          <ModuleStatistics
            title="On-chain Attestations"
            num={attestationsOnChainLen}
            iconList={attestationsOnChainIconList}
          />
        </div>
        <div className="cWrapper"></div>
      </div>
    </div>
  );
});

export default Overview;
