import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { DATASOURCEMAP } from '@/config/dataSource';
import { eventMetaMap } from '@/config/events';
import type { UserState } from '@/types/store';
import CreateZkAttestation from '@/newComponents/ZkAttestation/CreateZkAttestation';

import PMask from '@/newComponents/PMask';
import PButton from '@/newComponents/PButton';
import PClose from '@/newComponents/PClose';
import iconCircleSuc from '@/assets/newImg/layout/iconCircleSuc.svg';
import './index.scss';

import { LINEAEVENTNAME } from '@/config/events';

type TaskStatusMap = {
  [propName: string]: number;
};
type attestationMeta = {
  id: string;
  title: string;
  subTitle: string;
  dataSourceId: string;
  score: string;
};
type attestationMap = {
  [propName: string]: attestationMeta;
};
interface SetPwdDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  onChange: (id) => void;
}
const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onClose, onSubmit, onChange }) => {
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('id') as string;
    const eventMetaInfo = eventMetaMap[eventId];
    const [taskStatusMap, setTaskStatusMap] = useState<TaskStatusMap>({});
    const [xTabId, setXTabId] = useState<number>();
    const [PADOTabId, setPADOTabId] = useState<number>();
    const [visibleAssetDialog, setVisibleAssetDialog] = useState<string>('');
    const [attestationPresets, setAttestationPresets] = useState<any>();
    const connectedWallet = useSelector(
      (state: UserState) => state.connectedWallet
    );
    const activeOnChain = useSelector((state) => state.activeOnChain);
    const taskIds = useMemo(() => {
      let l: string[] = [];
      l = Object.keys(eventMetaInfo.taskMap.attestation);
      return l;
    }, []);
    const attestationMap: attestationMap = useMemo(() => {
      const m = taskIds.reduce((prev, curr) => {
        let subTitle = 'Proof of Account Ownership';
        let obj = { subTitle, id: curr };
        if (curr === '2') {
          Object.assign(obj, {
            dataSourceId: 'binance',
            title: 'Owns Binance Account',
            score: '+100 xp',
          });
        } else if (curr === '6') {
          Object.assign(obj, {
            dataSourceId: 'tiktok',
            title: 'Owns TikTok Account',
            subTitle,
            score: '+80 xp',
          });
        } else if (curr === '100') {
          Object.assign(obj, {
            dataSourceId: 'google',
            title: 'Owns Google Account',
            score: '+50 xp',
          });
        } else if (curr === '3') {
          Object.assign(obj, {
            dataSourceId: 'x',
            title: 'Owns X Account',
            score: '+50 xp',
          });
        }
        prev[curr] = obj;
        return prev;
      }, {});
      return m;
    }, [taskIds]);
    const formLegal = useMemo(() => {
      const allTask = Object.values(taskStatusMap);
      const allDone = allTask.every((i) => !!i);
      return allTask.length > 0 && allDone;
    }, [taskStatusMap]);

    const initTaskStatus = useCallback(async () => {
      const res = await chrome.storage.local.get([eventId]);
      const currentAddress = connectedWallet?.address;
      if (res[eventId]) {
        const lastEventObj = JSON.parse(res[eventId]);
        const lastInfo = lastEventObj[currentAddress];
        setTaskStatusMap({ ...lastInfo.taskMap.attestation });
      }
    }, [connectedWallet?.address]);
    const handleTask = useCallback(
      (i) => {
        if (taskStatusMap[i.id]) {
          return;
        } else {
          onChange(i.id);
        }
      },
      [taskStatusMap]
    );
    useEffect(() => {
      initTaskStatus();
    }, [initTaskStatus]);
    useEffect(() => {
      if (activeOnChain.loading === 0) {
        initTaskStatus();
      }
    }, [activeOnChain.loading]);

    return (
      <PMask>
        <div className="pDialog2 attestationTasksDialog">
          <PClose onClick={onClose} />
          <main>
            <header>
              <h1>Attestation Tasks</h1>
              <h2>
                Complete the tasks below to make your attestations. Make sure
                you connect the same wallet in the top right corner and in the
                BAS event page.
              </h2>
            </header>
            <ul className="attestationTasks">
              {Object.values(attestationMap).map((i, k) => {
                return (
                  <li
                    className={`task ${!!taskStatusMap[i.id] && 'done'}`}
                    key={k}
                    onClick={() => {
                      handleTask(i);
                    }}
                  >
                    <div className="left">
                      <div className="iconWrapper">
                        <img
                          src={DATASOURCEMAP[i.dataSourceId].icon}
                          alt=""
                          className="dataSourceIcon"
                        />
                        {!!taskStatusMap[i.id] && (
                          <img
                            src={iconCircleSuc}
                            alt=""
                            className="circleSucIcon"
                          />
                        )}
                      </div>
                      <div className="titleWrapper">
                        <div className="title">{i.title}</div>
                        <div className="subTitle">{i.subTitle}</div>
                      </div>
                    </div>
                    <div className="right">
                      <div className="score">{i.score}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <PButton
              text="Complete"
              className="fullWidth confirmBtn"
              onClick={onSubmit}
              disabled={!formLegal}
            ></PButton>
          </main>
        </div>
      </PMask>
    );
  }
);

export default SetPwdDialog;
