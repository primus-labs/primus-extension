import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';

import useDataSource from '@/hooks/useDataSource';
import useAuthorization from '@/hooks/useAuthorization';
import {
  setSocialSourcesAsync,
  setConnectWalletDialogVisibleAction,
} from '@/store/actions';
import { DATASOURCEMAP } from '@/config/dataSource';
import { eventMetaMap } from '@/config/events';
import type { Dispatch } from 'react';

import type { UserState } from '@/types/store';
import PBack from '@/newComponents/PBack';
import SplicedIcons from '@/newComponents/SplicedIcons';

import iconPado from '@/assets/newImg/events/iconPado.svg';

import './index.scss';
import PButton from '@/newComponents/PButton';
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

const stepList: StepItem[] = [
  {
    id: 1,
    title: 'Follow PADO social medial',
    finished: true,
    tasksProcess: {
      total: 2,
      current: 0,
    },
    // tasks: {}
  },
  {
    id: 2,
    title: 'Complete an attestation with a KYCed account on Binance',

    finished: false,
  },
  {
    id: 3,
    title: 'Submit to Linea',
    finished: false,
  },
  {
    id: 4,
    title: 'Go to Linea event page to check your status',

    finished: false,
  },
];

const DataSourceItem = memo(() => {
  const [visibleAssetDialog, setVisibleAssetDialog] = useState<string>('');
  const [attestationPresets, setAttestationPresets] = useState<any>();

  const [visibleConnectByWeb, setVisibleConnectByAPI] =
    useState<boolean>(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id') as string;

  const webProofTypes = useSelector((state: UserState) => state.webProofTypes);
  const {
    metaInfo: activeDataSouceMetaInfo,
    userInfo: activeDataSouceUserInfo,
    // deleteFn: deleteDataSourceFn,
  } = useDataSource(eventId);
  const authorize = useAuthorization();
  const dispatch: Dispatch<any> = useDispatch();
  const metaInfo = eventMetaMap[eventId];

  const activeConnectType = useMemo(() => {
    return activeDataSouceMetaInfo?.connectType;
  }, [activeDataSouceMetaInfo]);

  const hasConnected = useMemo(() => {
    if (eventId === 'web3 wallet') {
      return Object.values(activeDataSouceUserInfo).length > 0;
    } else {
      return activeDataSouceUserInfo?.name;
    }
  }, [activeDataSouceUserInfo]);

  const btnTxtEl = useMemo(() => {
    return activeConnectType ? 'Connect by ' + activeConnectType : 'Connect';
  }, [activeDataSouceMetaInfo]);
  const handleConnect = useCallback(async () => {
    if (activeDataSouceMetaInfo.name === 'Web3 Wallet') {
      await dispatch({ type: 'setRequireFetchAssets', payload: true });
      dispatch(setConnectWalletDialogVisibleAction(true));
      return;
    }
    if (activeConnectType === 'API') {
      setVisibleConnectByAPI(true);
    } else if (activeConnectType === 'Web') {
      const currRequestObj = webProofTypes.find(
        (r: any) => r.dataSource === eventId
      );
      // TODO-newui
      if (eventId === 'tiktok') {
        currRequestObj.datasourceTemplate.requests[0] = {
          name: 'first',
          url: 'https://www.tiktok.com/api/user/detail/',
          queryParams: ['WebIdLastTime'],
          method: 'GET',
          headers: ['User-Agent'],
          cookies: ['sessionid', 'tt-target-idc'],
        };
      }
      // TODO END

      // r.name === 'Account Ownership' &&
      chrome.runtime.sendMessage({
        type: 'dataSourceWeb',
        name: 'init',
        operation: 'connect',
        params: {
          ...currRequestObj,
        },
      });
    } else if (activeConnectType === 'Auth') {
      //  if (item.type === 'Social') {
      var authorizeSourceKey = eventId.toUpperCase();
      // if (authorizeSourceKey === 'G ACCOUNT') {
      //   authorizeSourceKey = 'GOOGLE';
      // }
      authorize(authorizeSourceKey, () => {
        dispatch(setSocialSourcesAsync());
      });
      //  } else if (item.type === 'Identity') {
      //    // TODO
      //    setActiveSource(item);
      //    setStep(0);
      //    setKYCDialogVisible(true);
      //  }
    }
  }, [activeDataSouceMetaInfo, dispatch]);
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSubmitConnectByAPI = useCallback(() => {
    setVisibleConnectByAPI(false);
  }, []);
  const handleCloseAssetDialog = useCallback(() => {
    setVisibleAssetDialog('');
  }, []);
  const handleSubmitAssetDialog = useCallback(() => {
    setVisibleAssetDialog('');
  }, []);
  const handleAttest = useCallback((i) => {
    setVisibleAssetDialog(i.attestationType);
    const presetsP = Object.keys({
      verificationContent: '',
      verificationValue: '',
      // account: ''
    }).reduce(
      (prev, curr) => {
        if (i[curr]) {
          prev[curr] = i[curr];
        }
        return prev;
      },
      { dataSourceId: eventId }
    );
    setAttestationPresets(presetsP);
  }, []);
  const formatPeriod = (period) => {
    const { startTime, endTime } = period;
    const s = dayjs.utc(+startTime).format('MMM.D,YYYY');
    const e = dayjs.utc(+endTime).format('MMM.D,YYYY');

    return `${s}-${e}`;
  };
  return (
    <div className="pageEventDetail">
      <div className="pageContent">
        <PBack onBack={handleBack} withLabel />
        <div className="brief">
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
        <div className="taskList">
          <h2 className="title">Task lists</h2>
          <ul className="tasks">
            {stepList.map((i, k) => {
              return (
                <li className="task" key={k}>
                  <div className="left">
                    <div className="order">Task {i.id}</div>
                    <div className="title">{i.title}</div>
                  </div>
                  <div className="right">
                    {i.tasksProcess && (
                      <div className="process">
                        <div className="txt">
                          {i.tasksProcess.current}/{i.tasksProcess.total}
                        </div>
                        <div className="bar">
                          <div className="current"></div>
                        </div>
                      </div>
                    )}

                    <PButton
                      text="Finish"
                      type="primary"
                      size="m"
                      onClick={() => {}}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="qs"></div>
      </div>
    </div>
  );
});

export default DataSourceItem;
