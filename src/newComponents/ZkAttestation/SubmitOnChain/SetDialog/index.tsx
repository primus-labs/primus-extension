import React, { useState, useCallback, memo, useMemo } from 'react';
import { ONCHAINLIST } from '@/config/chain';
import type { WALLETITEMTYPE } from '@/config/constants';
import PMask from '@/newComponents/PMask';
import PButton from '@/newComponents/PButton';
import PClose from '@/newComponents/PClose';
import POptions from '@/newComponents/POptions';
import './index.scss';
import { newWALLETITEMTYPE } from '@/types/config';

interface DataSourcesDialogProps {
  className?: string;
  title?: any;
  subTitle?: any;
  onClose?: () => void;
  onSubmit: (id: number | string) => void;
}

const ConnectWalletDialog: React.FC<DataSourcesDialogProps> = memo(
  ({
    onClose,
    onSubmit,
    className,
    title = 'Submit on-chain',
    subTitle = 'Choose a blockchain to submit your attestation.',
  }) => {
    const [activeSet, setActiveSet] = useState<string>();
    const filterdList = useMemo(() => {
      const list: newWALLETITEMTYPE[] = ONCHAINLIST.map((i: any) => {
        const { title, showName, icon, disabled } = i;
        return {
          id: title,
          name: showName,
          icon,
          disabled,
        };
      });
      return list;
    }, []);
    const computedCN = useMemo(() => {
      let cN = 'span1';
      if (filterdList.length >= 4) {
        return 'span2';
      } else if (filterdList.length >= 6) {
        return 'span3';
      }
      return cN;
    }, [filterdList]);
    const formLegal = useMemo(() => {
      return !!activeSet;
    }, [activeSet]);

    const handleClose = useCallback(() => {
      onClose && onClose();
    }, [onClose]);
    const handleChangeWallet = useCallback((item, id) => {
      setActiveSet(id);
    }, []);
    const handleSubmit = useCallback(() => {
      if (!formLegal) {
        return;
      }
      onSubmit(activeSet as string);
    }, [onSubmit, activeSet, formLegal]);

    return (
      <PMask>
        <div className={`pDialog2 setChainDialog ${className} ${computedCN}`}>
          <PClose onClick={handleClose} />
          <main>
            {title && (
              <header>
                <h1>{title}</h1>
                {subTitle && <h2>{subTitle}</h2>}
              </header>
            )}
            <POptions list={filterdList} onClick={handleChangeWallet} />
            <PButton
              text="Next"
              className="fullWidth confirmBtn"
              disabled={!formLegal}
              onClick={handleSubmit}
            ></PButton>
          </main>
        </div>
      </PMask>
    );
  }
);

export default ConnectWalletDialog;
