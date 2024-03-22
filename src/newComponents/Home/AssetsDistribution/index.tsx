import React, { memo, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveConnectDataSource } from '@/store/actions';
import './index.scss';
import AssetsBalance from '@/newComponents/AssetsBalance';

const Overview = memo(() => {

  return (
    <div className="homeAssetsDistribution">
      <div className="title">
        <span>Assets Distribution</span>
      </div>
      <div className="content">
        <AssetsBalance />
        <div className="cWrapper"></div>
      </div>
    </div>
  );
});

export default Overview;
