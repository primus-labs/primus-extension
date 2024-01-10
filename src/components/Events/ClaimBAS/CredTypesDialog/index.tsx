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
import { BASEVENTNAME } from '@/config/constants';
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
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
    const [eventDetail, setEventDetail] = useState<any>({ext:{}});
    const [errorTip, setErrorTip] = useState<string>();
    const [activeType, setActiveType] = useState<string>();
    const [proofStatusObj, setProofStatusObj] = useState<any>({});
    const taskScoreObj = useMemo(() => {
      const scoreKeyMap = {
        GOOGLE_ACCOUNT: '100',
        TIKTOK_ACCOUNT: '6',
        TWITTER_ACCOUNT: '3',
        BINANCE_ACCOUNT: '2',
      };
      const obj = eventDetail.ext.scoreList.reduce((prev, curr) => {
        const { source, score } = curr;
        prev[scoreKeyMap[source]] = score;
        return prev;
      }, {});
      return obj;
    }, [eventDetail.ext.scoreList]);
    const formatProofTypes = useMemo(() => {
      // proofTypes;

      const proofTypes = [
        {
          id: '3',
          credTitle: 'Owns Twitter Account',
          // score: '+50xp',
          credLogoUrl: iconDataSourceTwitter,
          credIntroduce: 'Proof of Account Ownership',
        },
        {
          id: '2',
          credTitle: 'Owns Binance Account',
          // score: '+30xp',
          credLogoUrl: iconDataSourceBinance,
          credIntroduce: 'Proof of Account Ownership',
        },

        {
          id: '100', // TODO!!!
          credTitle: 'Owns Google Account',
          // score: '+80xp',
          credLogoUrl: iconGoogle,
          credIntroduce: 'Proof of Account Ownership',
        },
        {
          id: '6',
          credTitle: 'Owns TikTok Account',
          // score: '+50xp',
          credLogoUrl: iconTikTok,
          credIntroduce: 'Proof of Account Ownership',
        },
      ];
      const newArr = proofTypes.map((i, k) => {
        return {
          ...i,
          finished: !!proofStatusObj[i.id],
          score: `+${taskScoreObj[i.id]}xp`,
        };
      });
      return newArr;
    }, [proofStatusObj, taskScoreObj]);
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
    const fetchEventDetail = useCallback(async () => {
      try {
        const res = await queryEventDetail({
          event: BASEVENTNAME,
        });
        const { rc, result } = res;
        if (rc === 0) {
          setEventDetail(result);
          //     "startTime": "1699819200000",
          // "endTime": "1700942400000",
          //   "ext": {
          //     "intractUrl": "https://www.intract.io/linea"
          // }
        }
      } catch {}
    }, []);
    useEffect(() => {
      fetchEventDetail();
    }, [fetchEventDetail]);

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog credTypesDialog basCredDialog">
          <main>
            <PBack onBack={onBack} />
            <header>
              <h1>Proof of Humanity</h1>
              <h2>Choose one of tasks below to make your POH attestation.</h2>
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
                          <div className="score">{item.score}</div>
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
