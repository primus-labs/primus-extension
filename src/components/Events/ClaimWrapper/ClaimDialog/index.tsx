import React, { FC, memo } from 'react';
import PMask from '@/components/PMask';
import PButton from '@/components/PButton';
import ClaimDialogHeaderDialog from '../ClaimDialogHeader';
// import iconShield from '@/assets/img/events/iconShield.svg';
import './index.scss';
interface ClaimDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  title?: string;
  titleIllustration?: boolean;
  subTitle?: string;
  rules?: string[];
  desc?: any;
  extra?: any;
  tip?: any;
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
const ClaimDialog: FC<ClaimDialogProps> = memo(
  ({
    onClose,
    onSubmit,
    title = 'Early Bird NFT Reward',
    titleIllustration = false,
    subTitle = 'Complete the following tasks to get:',
    rules = ruleItems,
    desc = descItem,
    extra,
    tip = 'PADO uses IZK to ensure your privacy',
  }) => {
    const hanldeSubmit = () => {
      onSubmit();
    };
    return (
      <PMask onClose={onClose}>
        <div className="padoDialog claimDialog">
          <main>
            <div className="headerWrapper">
              <ClaimDialogHeaderDialog
                title={title}
                illustration={titleIllustration}
              />
            </div>
            <div className="descContent">
              <p className="title">{subTitle}</p>
              <ul className="rules">
                {rules.map((i, k) => {
                  return (
                    <li key={k}>
                      <i>
                        <span></span>
                      </i>
                      <span>{i}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="desc">{desc}</p>
              {extra && <p className="extra">{extra}</p>}
              <p className="specialTip">
                <i className="iconfont icon-iconShield" />
                <span>{tip}</span>
              </p>
            </div>
          </main>
          <PButton text="Claim Now" onClick={hanldeSubmit} />
        </div>
      </PMask>
    );
  }
);
export default ClaimDialog;
