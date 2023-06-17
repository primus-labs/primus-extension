import React, { useState, memo } from 'react';

import PMask from '@/components/PMask';
import iconShield1 from '@/assets/img/iconShield1.svg';
import iconShield2 from '@/assets/img/iconShield2.svg';

import './index.sass';

export type ExplainItem = {
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
        icon: iconShield1,
        title: 'Your account is under your control',
        desc: 'PADO has no access to your account, cannot modify or delete your account data.',
      },
      {
        icon: iconShield2,
        title: 'Your data is safe and secure',
        desc: 'Your data is invisible to PADO. The data is only stored on your local device. We take best security practices for data transfer and aggregation.',
      },
    ]);
    return (
      <PMask onClose={onClose}>
        <div className="padoDialog dataFieldsExplainDialog">
          <div className="iconBack" onClick={onSubmit}></div>
          <main>
            <h1>Connect data under your control</h1>
            <ul className="explainItemList">
              {list.map((item) => {
                return (
                  <li className="explainItem" key={item.title}>
                    <img src={item.icon} alt="" />
                    <div className="explainItemC">
                      <h5>{item.title}</h5>
                      <h6>{item.desc}</h6>
                    </div>
                  </li>
                );
              })}
            </ul>
          </main>
          <button className="nextBtn" onClick={onSubmit}>
            Continue
          </button>
        </div>
      </PMask>
    );
  }
);

export default DataSourcesExplainDialog;
