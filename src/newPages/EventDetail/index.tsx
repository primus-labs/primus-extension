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
  
  const questionMap = {
    1: {
      id: 1,
      question: 'Does the connected wallet address matter?',
      answer:
        'The wallet address connected in the top right corner serves two key functions: it records your task complete process and determines your eligibility for events checking. Changing the connected wallet address will also impact the tasks process displayed in the task list. Make sure you connect the same wallet address here and on the Linea event page.',
      expand: true,
    },
    2: {
      id: 2,
      question: 'What should I do if the attestation process fails? ',
      answer:
        'As the attestation is under MPC-TLS process, it often depends on your internet condition. A quick.solution is to connect with a new Wifi network/connection, or change to a different VPN node, if possible. If you get an error message with an error code, feel free to contact us in the Discord #help channel.',
      expand: true,
    },
    3: {
      id: 3,
      question:
        'What does the “not meet the uniqueness requirement” error message mean?',
      answer:
        "Due to Linea’s requirements, each Binance KYC'ed account should be linked to only one wallet address. If you encounter this error message, it could mean either:Your Binance account is already linked to a different wallet address.Your currently connected wallet address is already linked to another Binance account through attestation.",
      expand: true,
    },
    4: {
      id: 4,
      question: 'Can I join this event with a different wallet address? ',
      answer:
        'Yes, you can join this event with different wallet address. When you change the connected wallet above the task list, the task status will reset and you can go through it with the newly connected wallet address. Remember, you also need to connect the new address on the BAS attestation alliance campaign page to earn your BAS XPS with this new address.',
      expand: true,
    },
    5: {
      id: 5,
      question: 'How are PADO points for this event counted?',
      answer:
        'For PADO points, it is counted based on your PADO extension account, which means PADO points will not be double counted when you switch wallet address.',
      expand: true,
    },
  };
  const [visibleAssetDialog, setVisibleAssetDialog] = useState<string>('');
  const [attestationPresets, setAttestationPresets] = useState<any>();

  const [visibleConnectByWeb, setVisibleConnectByAPI] =
    useState<boolean>(false);
  const [questionList, setQuestionList] = useState<any[]>(
    Object.values(questionMap)
  );
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id') as string;

  // const webProofTypes = useSelector((state: UserState) => state.webProofTypes);

  const dispatch: Dispatch<any> = useDispatch();
  const metaInfo = eventMetaMap[eventId];
  const foramtQuestionList = useMemo(() => {
    return [...Object.values(questionMap)]
  }, [questionMap]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const formatPeriod = (period) => {
    const { startTime, endTime } = period;
    const s = dayjs.utc(+startTime).format('MMM.D,YYYY');
    const e = dayjs.utc(+endTime).format('MMM.D,YYYY');

    return `${s}-${e}`;
  };
  const handleExpand = useCallback((i) => {
    const { expand } = questionMap[i.id];
    questionMap[i.id].expand = !expand;
    setQuestionList(Object.values(questionMap));
  }, []);
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

                    <PButton text="Finish" type="primary" onClick={() => {}} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="qsList">
          <h3 className="Frequently asked questions?"></h3>
          <ul className="qss">
            {questionList.map((i, k) => {
              return (
                <li className="qs" key={k}>
                  <p className="question">
                    <span>{i.question}</span>
                    <PButton
                      type="icon"
                      icon={
                        <i
                          className={`iconfont ${
                            i.expand ? 'icon-iconMinus' : 'icon-Add'
                          } `}
                        ></i>
                      }
                      onClick={() => handleExpand(i)}
                    />
                  </p>
                  {i.expand && <p className="answer">{i.answer}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
});

export default DataSourceItem;
