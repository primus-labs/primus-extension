import React, { useState, useCallback, memo } from 'react';
import { useSelector } from 'react-redux';

import PMask from '@/components/PMask';

import './index.sass';

import type { UserState } from '@/types/store';
import type { PROOFTYPEITEM } from '@/types/cred';

interface CredTypesDialogProps {
  onClose: () => void;
  onSubmit: (type: string) => void;
}

const CredTypesDialog: React.FC<CredTypesDialogProps> = memo(
  ({ onClose, onSubmit }) => {
    const [errorTip, setErrorTip] = useState<string>();
    const [activeType, setActiveType] = useState<string>();

    const proofTypes = useSelector((state: UserState) => state.proofTypes);

    const handleChange = (item: PROOFTYPEITEM) => {
      // if (item.enabled === 1) {
      //   return;
      // }
      setErrorTip('');
      setActiveType(item.credIdentifier);
    };
    const handleClickNext = () => {
      if (activeType) {
        onSubmit(activeType);
      } else {
        setErrorTip('Please select one credential type');
      }
    };
    const liClassName = useCallback(
      (item: PROOFTYPEITEM) => {
        let defaultCN = 'credTypeItem';
        if (item.enabled === 1) {
          defaultCN += ' disabled';
        }
        if (item.credIdentifier === activeType) {
          defaultCN += ' active';
        }
        return defaultCN;
      },
      [activeType]
    );
    return (
      <PMask onClose={onClose}>
        <div className="padoDialog credTypesDialog">
          <main>
            <h1>Create a Credential</h1>
            <h2>
              Select a proof type to make a credential. PADO uses TLS-MPC to
              verify the authenticity of your data.
            </h2>
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
