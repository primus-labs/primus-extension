import React, { useState, useCallback, memo, useEffect, useMemo } from 'react';
import PMask from '@/components/PMask';
import PSelect from '@/components/PSelect';

import './index.scss';
import iconDataSourceTwitter from '@/assets/img/iconDataSourceTwitter.svg';
import PButton from '@/components/PButton';
interface CredTypesDialogProps {
  onSubmit: (attetsationId: string) => void;
  onClose: () => void;
}

const CredTypesDialog: React.FC<CredTypesDialogProps> = memo(
  ({ onSubmit, onClose }) => {
    const identityList = [
      { value: '> 1', text: '> 1' },
      { value: '> 500', text: '> 500' },
    ];
    const [activeIdentityType, setActiveIdentityType] = useState<string>('');
    const handleChangeSelectIdentityType = useCallback((val: string) => {
      setActiveIdentityType(val);
    }, []);
    const formLegal = useMemo(() => {
      return !!activeIdentityType;
    }, [activeIdentityType]);

    const handleClickNext = useCallback(() => {
      if (!formLegal) {
        return;
      } else {
        if (activeIdentityType) {
          const num = activeIdentityType.split(' ')[1];
          sessionStorage.setItem('xFollowerCount', num);
          onSubmit('15');
        }
      }
    }, [formLegal, onSubmit, activeIdentityType]);

    useEffect(() => {
      const listerFn = (message: any) => {
        if (message.type === 'pageDecode') {
          if (
            message.name === 'cancelAttest' ||
            message.name === 'abortAttest'
          ) {
            onClose();
          }
        }
      };
      chrome.runtime.onMessage.addListener(listerFn);
      return () => {
        chrome.runtime.onMessage.removeListener(listerFn);
      };
    }, [onClose]);

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog createAttestationDialog">
          <main>
            <h1>Create Attestation</h1>
            <h2>You're creating Identity Proof.</h2>
            <div className="formItems">
              <div className="formItem">
                <div className="label">Attestation Content</div>
                <div className="value">X Followers</div>
              </div>
              <div className="formItem">
                <div className="label">Attestation Value</div>
                <div className="value">
                  <PSelect
                    options={identityList}
                    onChange={handleChangeSelectIdentityType}
                    val={activeIdentityType}
                    placeholder="Select"
                  />
                </div>
              </div>
              <div className="formItem">
                <div className="label">Data Source</div>
                <div className="value">
                  <img src={iconDataSourceTwitter} alt="" className="xIcon" />
                  <span>X</span>
                </div>
              </div>
            </div>
          </main>
          <footer>
            <PButton
              className={formLegal ? '' : 'gray'}
              text="Next"
              onClick={handleClickNext}
            />
          </footer>
        </div>
      </PMask>
    );
  }
);

export default CredTypesDialog;
