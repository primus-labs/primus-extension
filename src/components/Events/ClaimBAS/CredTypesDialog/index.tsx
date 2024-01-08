import React, { useState, useCallback, memo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom'
import PMask from '@/components/PMask';

import './index.scss';
import iconGoogle from '@/assets/img/iconGoogle.svg';
import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconDataSourceTwitter from '@/assets/img/iconDataSourceTwitter.svg';

import type { UserState } from '@/types/store';
import type { PROOFTYPEITEM } from '@/types/cred';
import PBottomErrorTip from '@/components/PBottomErrorTip';
import PButton from '@/components/PButton'

interface CredTypesDialogProps {
  onClose: () => void;
  onSubmit: (type: string) => void;
  type?: string;
}

const CredTypesDialog: React.FC<CredTypesDialogProps> = memo(
  ({ onClose, onSubmit, type }) => {
    const [searchParams] = useSearchParams();
const fromEvents = searchParams.get('fromEvents');
    
    const [errorTip, setErrorTip] = useState<string>();
    const [activeType, setActiveType] = useState<string>();

    const proofTypes = [
      {
        credTitle: 'Owns Google Account',
        score: '+80xp',
        credLogoUrl: iconGoogle,
        credIntroduce: 'Proof of Account Ownership',
      },
      {
        credTitle: 'Owns Twitter Account',
        score: '+50xp',
        credLogoUrl: iconDataSourceTwitter,
        credIntroduce: 'Proof of Account Ownership',
      },
      {
        credTitle: 'Owns Binance Account',
        score: '+30xp',
        credLogoUrl: iconDataSourceBinance,
        credIntroduce: 'Proof of Account Ownership',
      },
    ];

    const handleChange = useCallback(
      (item: PROOFTYPEITEM) => {
        if (item.enabled === 1) {
          return;
        }
        if (type && type !== item.credIdentifier) {
          return
        }
        setErrorTip('');
        setActiveType(item.credIdentifier);
      },
      [type]
    );
    const handleClickNext = () => {
      if (activeType) {
        onSubmit(activeType);
      } else {
        setErrorTip('Please select one proof type');
      }
    };
    const liClassName = useCallback(
      (item: PROOFTYPEITEM) => {
        let defaultCN = 'credTypeItem';
        if (item.enabled === 1 || (type && type !== item.credIdentifier)) {
          defaultCN += ' disabled';
        }
        if (item.credIdentifier === activeType) {
          defaultCN += ' active';
        }
        return defaultCN;
      },
      [activeType, type]
    );
    useEffect(() => {
      setActiveType(type);
    }, [type]);
    return (
      <PMask onClose={onClose}>
        <div className="padoDialog credTypesDialog basCredDialog">
          <main>
            <header>
              <h1>Proof of Humanity</h1>
              <h2>Choose one of tasks below to make your POH attestation.</h2>
            </header>
            <div className="scrollList">
              <ul className="credTypeList">
                {proofTypes.map((item: any) => (
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
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </main>
          <footer>
            <PButton text="Complete" onClick={handleClickNext} />
            {/* {errorTip && <PBottomErrorTip text={errorTip} />} */}
          </footer>
        </div>
      </PMask>
    );
  }
);

export default CredTypesDialog;
