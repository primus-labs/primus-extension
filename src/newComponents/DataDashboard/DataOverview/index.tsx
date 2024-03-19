import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUserInfo } from '@/services/api/achievements';

import useAllSources from '@/hooks/useAllSources';
import { DATASOURCEMAP } from '@/config/dataSource2';
import { EASInfo } from '@/config/chain';

import type { UserState } from '@/types/store';
import PButton from '@/newComponents/PButton';
import PEye from '@/newComponents/PEye';
import iconUpdate from '@/assets/newImg/layout/iconUpdate.svg';

import './index.scss';

const Overview = memo(() => {
  const { sourceMap } = useAllSources();
  const navigate = useNavigate();
  const [balanceVisible, setBalanceVisible] = useState<boolean>(true);
  const connectedSocialSources = useMemo(() => {
    return sourceMap.socialSources;
  }, [sourceMap]);
  const connectedKycSources = useMemo(() => {
    return sourceMap.kycSources;
  }, [sourceMap]);
  console.log('22connectedSocialSources', sourceMap);
  const handleExport = useCallback(() => {}, []);
  const handleAdd = useCallback(() => {
    navigate('/datas');
  }, [navigate]);
  const handleShow = useCallback(() => {
    setBalanceVisible((v) => !v);
  }, []);

  return (
    <div className="dataOverview">
      <div className="title">
        <span>Data Overview</span>
        <div className="operations">
          <div className="updateTip">
            <span>Updated 4mins ago</span>
            <img src={iconUpdate} />
          </div>
          <PButton
            type="secondary"
            size="s"
            text="Export"
            className="exportBtn"
            onClick={handleExport}
          />
          <PButton
            type="primary"
            size="s"
            text="Add"
            className="addBtn"
            onClick={handleAdd}
          />
        </div>
      </div>
      <div className="overviewItems">
        <section className={`assetsBalance overviewItem`}>
          <h4 className="title">
            <span>Assets Balance</span>
            <PEye onClick={handleShow} open={balanceVisible} />
          </h4>
          <div className="content">
            <div className="num">
              <div className="balance">$32,124</div>
              <div className="pnl">
                <div className="label">PnL</div>
                <div className="value">+$6.55(1.5%)</div>
              </div>
            </div>
          </div>
        </section>
        <section className={`followers overviewItem`}>
          <h4 className="title">
            <span>Followers</span>
          </h4>
          <div className="content">
            <div className="num">32.1k</div>
            <div className="from">
              <span>From</span>
              <ul className="sources">
                {Object.values(connectedSocialSources).map((i: any) => {
                  return (
                    <li key={i.id}>
                      <img src={i.icon} alt="" />
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
        {Object.values(connectedKycSources).length > 0 && (
          <section className={`identity overviewItem`}>
            <h4 className="title">
              <span>Identity Verification</span>
            </h4>
            <div className="content">
              <div className="val">Verified</div>
              <div className="from">
                <span>By</span>
                <ul className="sources">
                  {Object.values(connectedKycSources).map((i: any) => {
                    return (
                      <li key={i.id}>
                        <img src={i.icon} alt="" />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
});

export default Overview;
