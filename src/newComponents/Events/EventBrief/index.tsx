import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import { eventMetaMap } from '@/config/events';
import type { Dispatch } from 'react';
import SplicedIcons from '@/newComponents/SplicedIcons';
import iconPado from '@/assets/newImg/events/iconPado.svg';
import './index.scss';

dayjs.extend(utc);

type StepItem = {
  id: number;

  title: string;
  // subTitle: string;
  finished?: boolean;
  extra?: string;
  tasksProcess?: any;
  tasks?: any;
};

const DataSourceItem = memo(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id') as string;

  // const webProofTypes = useSelector((state: UserState) => state.webProofTypes);
  const metaInfo = eventMetaMap[eventId];
  const formatPeriod = (period) => {
    const { startTime, endTime } = period;
    const s = dayjs.utc(+startTime).format('MMM.D,YYYY');
    const e = dayjs.utc(+endTime).format('MMM.D,YYYY');
    return `${s}-${e}`;
  };

  return (
    <div className="eventBrief">
      <div className="picContent">
        <SplicedIcons
          list={
            metaInfo.combineType === '1'
              ? [metaInfo.icon, iconPado]
              : [iconPado]
          }
        />
        <span>{metaInfo.title}</span>
      </div>
      <div className="txtWrapper">
        <div className="descItems">
          {metaInfo.periodType === '1' && (
            <div className="descItem">
              <i className="iconfont icon-iconBlockChain"></i>
              <span>{metaInfo.chainDesc}</span>
            </div>
          )}
          {metaInfo.periodType === '0' && (
            <div className="descItem">
              <i className="iconfont icon-iconCalendar"></i>
              <span>{formatPeriod(metaInfo.period)}</span>
            </div>
          )}
          <div className="descItem">
            <i className="iconfont icon-iconGift"></i>
            <span>{metaInfo.gift}</span>
          </div>
        </div>
        <div className="desc">{metaInfo.longDesc}</div>
      </div>
    </div>
  );
});

export default DataSourceItem;
