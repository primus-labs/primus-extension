import React, {  useCallback, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import EventQS from '@/newComponents/Events/EventQS';
import EventBrief from '@/newComponents/Events/EventBrief';
import EventTaskList from '@/newComponents/Events/EventTaskList';

import PBack from '@/newComponents/PBack';
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
    title: 'Follow Primus social medial',
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id') as string;

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
