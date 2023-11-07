import React, { FC, memo, useMemo, useCallback, useState } from 'react';
import {useSelector } from 'react-redux'
import PMask from '@/components/PMask';
import PButton from '@/components/PButton';
import ClaimDialogHeaderDialog from '@/components/Events/ClaimWrapper/ClaimDialogHeader';
// import iconShield from '@/assets/img/events/iconShield.svg';
import './index.scss';
import type { UserState } from '@/types/store';
import type { CredTypeItemType } from '@/types/cred';

import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconDataSourceTwitter from '@/assets/img/iconDataSourceTwitter.svg';
import iconDataSourceOnChainAssets from '@/assets/img/iconDataSourceOnChainAssets.svg';

interface ClaimDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  title?: string;
  titleIllustration?: boolean;
  subTitle?: string;
}
const ruleItems = [
  'Connected API data',
  'Generate any attestation',
  'Submit at least one attestation to Linea mainnet',
];

const descItem = (
  <>
    You will have an Early Bird NFT after completing the event. (
    <span>Each user can only claim one</span>)
  </>
);
type StepItem = {
  id: number;
  icon: any;
  title: string;
  subTitle: string;
};
const stepList: StepItem[] = [
  {
    id: 1,
    icon: iconDataSourceOnChainAssets,
    title: 'Connected to',
    subTitle: '0x4EeF39D1c9f3c8928c8c289c3Dd55e579115221e',
  },
  {
    id: 2,
    icon: iconDataSourceTwitter,
    title: 'Owns X account',
    subTitle: 'Connect your account to attest',
  },
  {
    id: 3,
    icon: iconDataSourceBinance,
    title: 'Owns Binance account',
    subTitle: 'Connect your account to attest',
  },
];
const ClaimDialog: FC<ClaimDialogProps> = memo(
  ({
    onClose,
    onSubmit,
    title = '',
    titleIllustration = false,
    subTitle = '',
   
  }) => {
    const [activeStep, setActiveStep] = useState<number>();
    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );
    const proofsFlag: boolean = useMemo(() => {
      let credArr = Object.values(credentialsFromStore);
      const haveXProof = credArr.find(i => i.event === "LINEA_DEFI_VOYAGE" && i.source === 'x')
      const haveBinanceProof = credArr.find(
        (i) => i?.event === 'LINEA_DEFI_VOYAGE' && i.source === 'binance'
      );
      return !!haveXProof && !!haveBinanceProof;
    }, [credentialsFromStore]);
    
    const hanldeSubmit = () => {
      onSubmit();
    };
    const handleChange = useCallback((item: StepItem) => {
      if (item.id === 1) {
        return;
      }
      //
      setActiveStep(item.id);
    }, []);
   
    const liClassName = useCallback(
      (item: StepItem) => {
        let defaultCN = 'credTypeItem';

        if (item.id === activeStep) {
          defaultCN += ' active';
        }
        return defaultCN;
      },
      [activeStep]
    );
    return (
      <PMask onClose={onClose}>
        <div className="padoDialog claimDialog claimScrollEventDialog">
          <main>
            <div className="headerWrapper">
              <ClaimDialogHeaderDialog
                title={title}
                illustration={titleIllustration}
              />
            </div>
            <div className="descContent">
              <p className="title">{subTitle}</p>
              <ul className="credTypeList">
                {stepList.map((item) => (
                  <li
                    className={liClassName(item)}
                    onClick={() => {
                      handleChange(item);
                    }}
                    key={item.id}
                  >
                    <div className="innerContent">
                      <img className="icon" src={item.icon} alt="" />
                      <div className="con">
                        <h5 className="title">{item.title}</h5>
                        <h6 className="desc">{item.subTitle}</h6>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="descWrapper">
                <p>
                  Connect your X ( formerly Twitter) and Binance accounts to
                  verify your humanity and claim your attestations on the Scroll
                  Network.
                </p>
                <p>Bridge your ETH here: https://scroll.io/bridge</p>
              </div>
            </div>
          </main>
          <PButton text="Submit" onClick={hanldeSubmit} />
        </div>
      </PMask>
    );
  }
);
export default ClaimDialog;
