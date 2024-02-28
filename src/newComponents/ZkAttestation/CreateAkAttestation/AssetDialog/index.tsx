import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import type { UserState } from '@/types/store';

import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import SetDetail from '../SetDetail';
import SetDataSource from '../SetDataSource';
import OrderItem from '@/newComponents/OrderItem';
import './index.scss';

interface PButtonProps {
  // sourceName: string;
  onClose: () => void;
  onSubmit: () => void;
}

const Nav: React.FC<PButtonProps> = memo(({ onClose, onSubmit }) => {
  const [step, setStep] = useState<number>(1);
  const [assetForm, setAssetForm] = useState<any>({});
  // const [hadSetPwd, setHadSetPwd] = useState<boolean>(false);
  const lastLoginHasPwd = useSelector(
    (state: UserState) => state.lastLoginHasPwd
  );
  const webProofTypes = useSelector((state: UserState) => state.webProofTypes);
  const activeWebProofTemplate = useMemo(() => {
    if (assetForm.dataSourceId) {
      const obj = webProofTypes.find(
        (i) =>
          i.dataSource === assetForm.dataSourceId && i.name === 'Assets Proof'
      );
      return obj;
    } else {
      return {};
    }
  }, [assetForm.dataSourceId, webProofTypes]);
  const handleSubmitSetPwdDialog = useCallback((dataSourceId: string) => {
    // onSubmit();
    debugger;
    setAssetForm((f) => ({ ...f, dataSourceId: dataSourceId }));
    setStep(2);
  }, []);
  const handleSubmitSetAPIDialog = useCallback(() => {
    onClose();
  }, []);
  const handleSubmitSetDetail = useCallback(
    (form) => {
      setAssetForm((f) => ({ ...f, ...form }));
      debugger;
      // activeWebProofTemplate;
    },
    [activeWebProofTemplate]
  );

  // useEffect(() => {
  //   setStep(lastLoginHasPwd ? 3 : 1);
  // }, []);

  return (
    <PMask>
      {/* onClose={onClose} closeable={!fromEvents} */}
      <div className="pDialog2 assetAttestationDialog">
        <PClose onClick={onClose} />
        <main>
          <header>
            <h1>Create zkAttestation</h1>
            <h2>You're creating assets certification.</h2>
          </header>
          {step === 1 && (
            <section className="detailWrapper">
              <div className="step step1">
                <OrderItem order="1" text="Choose data source" />
              </div>
            </section>
          )}
          {/* {step === 2 && (
              <section className="detailWrapper">
                <div className="step step1 done">
                  <img className="iconDone" src={iconDone} alt="" />
                  <div className="txt">Set up password</div>
                </div>
                <div className="step step2">
                  <div className="tit">
                    <div className="order">2</div>
                    <span>Access your data</span>
                  </div>
                  <div className="con">
                    Configure with your READ-ONLY API keys
                  </div>
                </div>
              </section>
            )} */}
          {step === 1 && <SetDataSource onSubmit={handleSubmitSetPwdDialog} />}
          {step === 2 && <SetDetail onSubmit={handleSubmitSetDetail} />}
        </main>
      </div>
    </PMask>
  );
});

export default Nav;
