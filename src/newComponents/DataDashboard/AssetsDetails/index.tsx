import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import BigNumber from 'bignumber.js';
import { Pagination } from 'antd';
import {
  setExSourcesAsync,
  setOnChainAssetsSourcesAsync,
} from '@/store/actions';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
import useMsgs from '@/hooks/useMsgs';
import {
  sub,
  add,
  div,
  formatNumeral,
  getTotalBalFromNumObjAPriceObj,
  getTotalBalFromAssetsMap,
} from '@/utils/utils';
import { WALLETMAP } from '@/config/wallet';

import useAllSources from '@/hooks/useAllSources';
import PButton from '@/newComponents/PButton';
import PPTabs from '@/newComponents/PTabs';
import PStar from '@/newComponents/PStar';

import './index.scss';
import SplicedIcons from '@/newComponents/SplicedIcons';
import PArrow from '@/newComponents/PArrow';
import Portfolio from './Portfolio';
import Token from './Token';
import Chain from './Chain';
const MAX = 5;
const tList = [
  { label: 'Portfolio', value: 'Portfolio' },
  { label: 'Token', value: 'Token' },
  { label: 'Chain', value: 'Chain' },
];
const AssetsDetails = memo(() => {
  const { addMsg } = useMsgs();
  const {
    totalOnChainAssetsBalance,
    totalAssetsBalance,
    formatTotalAssetsBalance,
    totalPnl,
    totalPnlPercent,
    formatTotalPnlPercent,
  } = useAssetsStatistic();
  const dispatch = useDispatch();
  const { sourceMap, sourceMap2 } = useAllSources();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(1);
  const [ttt, setTtt] = useState('Portfolio');

  const sysConfig = useSelector((state) => state.sysConfig);

  const handleShare = useCallback(() => {}, []);

  return (
    <div className="assetsDetails">
      <div className="title">
        <span>Data Overview</span>
        <div className="operations">
          <PButton
            type="text"
            text="Share on social media"
            suffix={<i className="iconfont icon-iconShare"></i>}
            onClick={handleShare}
          />
        </div>
      </div>
      <div className="content">
        <PPTabs
          list={tList}
          onChange={(p) => {
            setTtt(p);
          }}
          value={ttt}
        />
        {ttt === 'Portfolio' && <Portfolio />}
        {ttt === 'Token' && <Token />}
        {ttt === 'Chain' && <Chain />}
        
      </div>
    </div>
  );
});

export default AssetsDetails;
