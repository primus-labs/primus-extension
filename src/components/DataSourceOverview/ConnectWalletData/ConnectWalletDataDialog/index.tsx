import React, { useState, useEffect, memo, useCallback } from 'react';
import { WALLETLIST } from '@/config/constants';

import PControledInput from '@/components/PControledInput';
import Bridge from '@/components/DataSourceOverview/Bridge/index';
import PMask from '@/components/PMask';
import SourceGroup from '@/components/DataSourceOverview/SourceGroups/SourceGroup';
import iconDataSourceOnChainAssets from '@/assets/img/iconDataSourceOnChainAssets.svg';
import PBottomErrorTip from '@/components/PBottomErrorTip';
import PBack from '@/components/PBack';
import './index.sass';

import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';
import type { WALLETITEMTYPE } from '@/config/constants';
export type GetDataFormProps = {
  label?: string;
};
interface ConnectWalletDataDialogProps {
  onClose: () => void;
  onSubmit: (item: WALLETITEMTYPE) => void;
  onCancel: () => void;
}

const ConnectWalletDataDialog: React.FC<ConnectWalletDataDialogProps> = memo(
  ({ onClose, onSubmit, onCancel }) => {
    const [errorTip, setErrorTip] = useState<string>();
    const [activeItem, setActiveItem] = useState<WALLETITEMTYPE>();
    const [label, setLabel] = useState<string>();

    const onChangeWallet = (item: WALLETITEMTYPE) => {
      console.log('onChangeWallet', item)
      setActiveItem(item)
    }
    const handleClickNext = () => {
      if (!activeItem) {
        setErrorTip('Please select one wallet');
        return;
      }
      onSubmit(activeItem);
    };

    const handleChangeLabel = useCallback((val: string) => {
      setLabel(val);
    }, []);

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog connectWalletDataDialog">
          <PBack onBack={onCancel} />
          <main>
            <Bridge endIcon={iconDataSourceOnChainAssets} />
            <h1>Connect Your Data</h1>
            <h2>Please confirm your on-chain address. </h2>
            <div className="formItem ">
              <h6>Select your wallet to confirm</h6>
              <SourceGroup onChange={onChangeWallet} list={WALLETLIST} />
            </div>
            <div className="formItem lastFormItem">
              <h6>Label (Optional)</h6>
              <PControledInput
                key="label"
                placeholder="Please set your Label"
                onChange={handleChangeLabel}
                value={label}
              />
            </div>
          </main>
          <button className="nextBtn" onClick={handleClickNext}>
            {errorTip && <PBottomErrorTip text={errorTip} />}
            <span>Next</span>
          </button>
        </div>
      </PMask>
    );
  }
);

export default ConnectWalletDataDialog;
