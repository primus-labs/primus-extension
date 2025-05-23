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
import { EARLYBIRDNFTEVENTNAME } from '@/config/events';
import tagCompleted from '@/assets/newImg/events/tagCompleted.png';
import { UserState } from '@/types/store';
// import tagCompleted from '@/assets/newImg/events/iconPado.svg';

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
  const [isComplete, setIsComplete] = useState<boolean>(false);
  // const webProofTypes = useSelector((state: UserState) => state.webProofTypes);
  const metaInfo = eventMetaMap[eventId];
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  const attestLoading = useSelector((state: UserState) => state.attestLoading);
  const activeOnChain = useSelector((state: UserState) => state.activeOnChain);
  const earlyBirdNFTs = useSelector((state: UserState) => state.earlyBirdNFTs);
  const formatPeriod = (period) => {
    const { startTime, endTime } = period;
    const s = dayjs.utc(+startTime).format('MMM.D,YYYY');
    const e = dayjs.utc(+endTime).format('MMM.D,YYYY');
    return `${s}-${e}`;
  };

  const initTaskStatus = useCallback(async () => {
    const res = await chrome.storage.local.get([eventId]);
    const currentAddress = connectedWallet?.address;
    if (res[eventId]) {
      const lastEventObj = JSON.parse(res[eventId]);
      const lastInfo = lastEventObj[currentAddress];
      if (lastInfo) {
        const { taskMap } = lastInfo;
        let requiredTaskMap = { ...taskMap };
        delete requiredTaskMap.check;
        const statusM = Object.keys(requiredTaskMap).reduce((prev, curr) => {
          const currTask = taskMap[curr];
          // tasksProcess
          if (currTask) {
            const taskLen = Object.keys(currTask).length;
            const doneTaskLen = Object.values(currTask).filter(
              (i) => !!i
            ).length;
            const allDone = taskLen === doneTaskLen;
            prev[curr] = allDone ? 1 : 0;
          }
          return prev;
        }, {});
        const f = Object.values(statusM).every((i) => !!i);
        setIsComplete(f);
      } else {
        setIsComplete(false);
      }
    }
    if (eventId == EARLYBIRDNFTEVENTNAME) {
      if (Object.keys(earlyBirdNFTs).length > 0) {
        setIsComplete(true);
      }
    }
  }, [connectedWallet?.address, earlyBirdNFTs]);
  useEffect(() => {
    initTaskStatus();
  }, [initTaskStatus]);
  useEffect(() => {
    if (attestLoading > 1 || activeOnChain?.loading === 0) {
      initTaskStatus();
    }
  }, [attestLoading, activeOnChain]);

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
        {isComplete && <img src={tagCompleted} alt="" className="tag" />}
      </div>
      <div className="txtWrapper">
        <div className="descItems">
          {metaInfo.points.map((p, index) => {
            return (
              <div className="descItem" key={index}>
                <div className={`iconfont ${p.pointIconFont}`}></div>
                <span>{p.pointDesc}</span>
              </div>
            );
          })}
          {/* {metaInfo.periodType === '1' && (
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
          </div> */}
        </div>
        <div className="desc">{metaInfo.longDesc}</div>
      </div>
    </div>
  );
});

export default DataSourceItem;
