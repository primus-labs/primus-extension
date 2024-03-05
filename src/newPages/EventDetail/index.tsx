import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';

import useAuthorization from '@/hooks/useAuthorization';
import {
  setSocialSourcesAsync,
  setConnectWalletDialogVisibleAction,
} from '@/store/actions';
import { DATASOURCEMAP } from '@/config/dataSource';
import { eventMetaMap } from '@/config/events';
import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import EventQS from '@/newComponents/Events/EventQS';
import EventBrief from '@/newComponents/Events/EventBrief';
import EventTaskList from '@/newComponents/Events/EventTaskList';

import PBack from '@/newComponents/PBack';
import PButton from '@/newComponents/PButton';
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

const stepList: StepItem[] = [
  {
    id: 1,
    title: 'Follow PADO social medial',
    finished: false,
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
    tasksProcess: {
      total: 1,
      current: 0,
    },
  },
  {
    id: 3,
    title: 'Submit to Linea',
    finished: false,
    tasksProcess: {
      total: 1,
      current: 0,
    },
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

  // const webProofTypes = useSelector((state: UserState) => state.webProofTypes);

  const dispatch: Dispatch<any> = useDispatch();
  const metaInfo = eventMetaMap[eventId];

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

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
        <EventBrief/>
        <EventTaskList/>
        <EventQS />
      </div>
    </div>
  );
});

export default DataSourceItem;
