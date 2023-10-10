import React, { useState, useCallback, memo, useEffect } from 'react';
import { useSelector } from 'react-redux';

import PMask from '@/components/PMask';

import './index.sass';

import type { UserState } from '@/types/store';
import type { PROOFTYPEITEM } from '@/types/cred';

interface CredTypesDialogProps {
  onClose: () => void;
  onSubmit: (type: string) => void;
  type?: string;
}

const CredTypesDialog: React.FC<CredTypesDialogProps> = memo(
  ({ onClose, onSubmit, type }) => {
    const [errorTip, setErrorTip] = useState<string>();
    const [activeType, setActiveType] = useState<string>();

    const proofTypes = useSelector((state: UserState) => state.proofTypes);
    const webProofTypes = useSelector((state: UserState) => state.webProofTypes);

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
    const handlePageDecode = useCallback(async (webProofMeta: any) => {
      await chrome.runtime.sendMessage({
        type: 'pageDecode',
        name: 'inject',
        params: {
          ...webProofMeta,
        },
      });
    }, []);
    useEffect(() => {
      setActiveType(type);
    }, [type]);
    return (
      <PMask onClose={onClose}>
        <div className="padoDialog credTypesDialog">
          <main>
            <h1>Create Your Proof</h1>
            <h2>PADO uses interactive ZK protocol to attesting your data.</h2>
            <div className="scrollList">
              <ul className="credTypeList">
                {proofTypes.map((item) => (
                  <li
                    className={liClassName(item)}
                    onClick={() => {
                      handleChange(item);
                    }}
                    key={item.credTitle}
                  >
                    <img className="icon" src={item.credLogoUrl} alt="" />
                    <div className="con">
                      <h5 className="title">{item.credTitle}</h5>
                      <h6 className="desc">{item.credIntroduce}</h6>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </main>
          {webProofTypes.map(p => {
            return (
              <button key={p.id}  className="openPageDataSource" onClick={() => {handlePageDecode(p)}}>
                {p.name}
              </button>
            );
          })}
          {/* <button className="openPageDataSource" onClick={handlePageDecode}>
            Binance KYC
          </button>
          <button className="openPageDataSource" onClick={handlePageDecode2}>
            Binance Nationality
          </button> */}

          <button className="nextBtn" onClick={handleClickNext}>
            {errorTip && (
              <div className="tipWrapper">
                <div className="errorTip">{errorTip}</div>
              </div>
            )}
            <span>Select</span>
          </button>
        </div>
      </PMask>
    );
  }
);

export default CredTypesDialog;
