import React, { useState, memo } from 'react';

import PMask from '@/components/PMask';
import PBack from '@/components/PBack';
import PButton from '@/components/PButton';
import iconShield1 from '@/assets/img/iconShield1.svg';
import iconShield2 from '@/assets/img/iconShield2.svg';

import './index.scss';

export type ExplainItem = {
  iconName?: string;
  icon: any;
  title: string;
  desc: string;
};
interface DataSourcesExplainDialogProps {
  onClose: () => void;
  onSubmit: () => void;
}
const DataSourcesExplainDialog: React.FC<DataSourcesExplainDialogProps> = memo(
  ({ onClose, onSubmit }) => {
    const [list] = useState<ExplainItem[]>([
      {
        iconName: 'iconShield1',
        icon: iconShield1,
        title: 'Your account is under control',
        desc: 'PADO has no access to your account, cannot modify or delete your account data.',
      },
      {
        iconName: 'iconShield2',
        icon: iconShield2,
        title: 'Your data is safe and secure',
        desc: 'Your data is invisible to PADO. The data is only stored on your local device. We take best security practices for data transfer and aggregation.',
      },
    ]);
    return (
      <PMask onClose={onClose}>
        <div className="padoDialog dataFieldsExplainDialog">
          <PBack onBack={onSubmit} />
          <main>
            <header>
              <h1>Under Your Control</h1>
            </header>
            <ul className="explainItemList">
              {list.map((item) => {
                return (
                  <li className="explainItem" key={item.title}>
                    {/* <img src={item.icon} alt="" /> */}
                    {item.iconName ? (
                      <i className={`iconfont icon-${item.iconName}`}></i>
                    ) : item.icon ? (
                      <img src={item.icon} alt="" />
                    ) : (
                      ''
                    )}
                    <div className="explainItemC">
                      <h5>{item.title}</h5>
                      <h6>{item.desc}</h6>
                    </div>
                  </li>
                );
              })}
            </ul>
          </main>
          <PButton text="OK" onClick={onSubmit}></PButton>
          {/* <button className="nextBtn" onClick={onSubmit}>
            Continue
          </button> */}
        </div>
      </PMask>
    );
  }
);

export default DataSourcesExplainDialog;
