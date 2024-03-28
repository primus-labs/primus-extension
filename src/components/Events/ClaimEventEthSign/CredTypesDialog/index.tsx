import React, { useState, useCallback, memo, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import PMask from '@/components/PMask';
import PBack from '@/components/PBack';

import './index.scss';
import iconGoogle from '@/assets/img/iconGoogle.svg';
import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconDataSourceTwitter from '@/assets/img/iconDataSourceTwitter.svg';
import iconSuc from '@/assets/img/iconSuc.svg';

import type { UserState } from '@/types/store';
import type { PROOFTYPEITEM } from '@/types/cred';
import PBottomErrorTip from '@/components/PBottomErrorTip';
import PButton from '@/components/PButton';
import { BASEVENTNAME, GOOGLEWEBPROOFID } from '@/config/constants';
import { queryEventDetail } from '@/services/api/event';
import iconTikTok from '@/assets/img/credit/iconTikTok.svg';

interface CredTypesDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  onChange: (proofId: string) => void;
  onBack: () => void;
}

const CredTypesDialog: React.FC<CredTypesDialogProps> = memo(
  ({ onClose, onSubmit, onChange, onBack }) => {
    
    const [activeType, setActiveType] = useState<string>();
    const [proofStatusObj, setProofStatusObj] = useState<any>({});
    const connectedWallet = useSelector(
      (state: UserState) => state.connectedWallet
    );
    const formatProofTypes = useMemo(() => {
      const proofTypes = [
        {
          id: '2',
          credTitle: 'Owns Binance Account',
          score: 100,
          credLogoUrl: iconDataSourceBinance,
          credIntroduce: 'Proof of Account Ownership',
        },
        {
          id: '6',
          credTitle: 'Owns TikTok Account',
          score: 80,
          credLogoUrl: iconTikTok,
          credIntroduce: 'Proof of Account Ownership',
        },

        {
          id: GOOGLEWEBPROOFID,
          credTitle: 'Owns Google Account',
          score: 60,
          credLogoUrl: iconGoogle,
          credIntroduce: 'Proof of Account Ownership',
        },

        {
          id: '3',
          credTitle: 'Owns Twitter Account',
          score: 60,
          credLogoUrl: iconDataSourceTwitter,
          credIntroduce: 'Proof of Account Ownership',
        },
      ];
      let newArr = proofTypes.map((i, k) => {
        return {
          ...i,
          finished: !!proofStatusObj[i.id],
        };
      });
      newArr = newArr.sort((a: any, b: any) => b.score - a.score);
      return newArr;
    }, [proofStatusObj]);
    const isComplete = useMemo(() => {
      const hasProof = formatProofTypes.some((i) => i.finished);
      return hasProof;
    }, [formatProofTypes]);
    const btnCN = useMemo(() => {
      return isComplete ? '' : 'gray';
    }, [isComplete]);

    const handleChange = useCallback(
      (item: any) => {
        if (item.finished) {
          return;
        }
        setActiveType(item.id);
        onChange(item.id);
      },
      [onChange]
    );
    const handleClickNext = useCallback(() => {
      if (!isComplete) {
        return;
      } else {
        onSubmit();
      }
    }, [isComplete, onSubmit]);
    const liClassName = useCallback(
      (item: any) => {
        let defaultCN = 'credTypeItem';
        if (item.id === activeType) {
          defaultCN += ' active';
        }
        if (item.finished) {
          defaultCN += ' excitable';
        }
        return defaultCN;
      },
      [activeType]
    );
    useEffect(() => {
      chrome.storage.local.get([BASEVENTNAME], (res) => {
        if (res[BASEVENTNAME]) {
          const lastInfo = JSON.parse(res[BASEVENTNAME]);
          const lastProofInfo = lastInfo.steps[1];
          if (lastProofInfo.tasks) {
            setProofStatusObj(lastProofInfo.tasks);
          }
        }
      });
    }, []);
    useEffect(() => {
      const listerFn = (message: any) => {
        if (message.type === 'pageDecode') {
          if (
            message.name === 'cancelAttest' ||
            message.name === 'abortAttest'
          ) {
            setActiveType(undefined);
          }
        }
      };
      chrome.runtime.onMessage.addListener(listerFn);
      return () => {
        chrome.runtime.onMessage.removeListener(listerFn);
      };
    }, []);
    const initTaskStatus = useCallback(async () => {
      const res = await chrome.storage.local.get([eventId]);
      const currentAddress = connectedWallet?.address;
      if (res[eventId]) {
        const lastEventObj = JSON.parse(res[eventId]);
        const lastInfo = lastEventObj[currentAddress];

        if (lastInfo) {
          const { taskMap } = lastInfo;
          const newStepMap = { ...stepMap };
          const statusM = Object.keys(taskMap).reduce((prev, curr) => {
            const currTask = taskMap[curr];
            // tasksProcess
            if (currTask) {
              const taskLen = Object.keys(currTask).length;
              const doneTaskLen = Object.values(currTask).filter(
                (i) => !!i
              ).length;
              const allDone = taskLen === doneTaskLen;

              newStepMap[curr].tasksProcess.total = taskLen;
              newStepMap[curr].tasksProcess.current = doneTaskLen;
              newStepMap[curr].finished = allDone;

              prev[curr] = allDone ? 1 : 0;
            }
            return prev;
          }, {});
          setStepMap(newStepMap);
          setTaskStatusMap({ ...statusM });
        } else {
          setStepMap(JSON.parse(JSON.stringify(eventTaskMap[eventId])));
          setTaskStatusMap({ ...initStatusMap });
        }
      }
    }, [connectedWallet?.address]);
    useEffect(() => {
      initTaskStatus;
    }, [initTaskStatus]);

    return (
      <PMask closeable={false}>
        <div className="padoDialog credTypesDialog basCredDialog">
          <main>
            <PBack onBack={onBack} />
            <header>
              <h1>Attestation Tasks</h1>
              <h2>Complete the tasks below to make your attestations.</h2>
            </header>
            <div className="scrollList">
              <ul className="credTypeList">
                {formatProofTypes.map((item: any) => (
                  <li
                    className={liClassName(item)}
                    onClick={() => {
                      handleChange(item);
                    }}
                    key={item.credTitle}
                  >
                    <div className="innerContent">
                      <img className="icon" src={item.credLogoUrl} alt="" />
                      <div className="con">
                        <h5 className="title">
                          <span>{item.credTitle}</span>
                          <div className="score">+{item.score}xp</div>
                        </h5>
                        <h6 className="desc">{item.credIntroduce}</h6>
                      </div>
                      {item.finished && <img src={iconSuc} alt="" />}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </main>
          <footer>
            <PButton
              className={btnCN}
              text="Complete"
              onClick={handleClickNext}
            />
          </footer>
        </div>
      </PMask>
    );
  }
);

export default CredTypesDialog;
