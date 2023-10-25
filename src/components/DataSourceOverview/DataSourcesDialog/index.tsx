import React, { useState, memo } from 'react';
import { useSearchParams } from 'react-router-dom';

import SourceGroups from '../SourceGroups';
import PMask from '@/components/PMask';
import PButton from '@/components/PButton';
import iconInfo from '@/assets/img/iconInfo.svg';
import type { ExchangeMeta } from '@/types/dataSource';
import './index.scss';

export type DataFieldItem = {
  icon: any;
  name: string;
  type: string;
  desc?: string;
  requirePassphase?: boolean;
};
interface DataSourcesDialogProps {
  onClose: () => void;
  onSubmit: (item: ExchangeMeta) => void;
  onCheck: () => void;
  // onCancel: () => void
}
const DataSourcesDialog: React.FC<DataSourcesDialogProps> = memo(
  ({ onClose, onSubmit, onCheck }) => {
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
    const [activeItem, setActiveItem] = useState<ExchangeMeta>();

    const handleClickNext = () => {
      if (!activeItem) {
        return;
      }
      onSubmit(activeItem);
    };

    const handleClickData = (item: ExchangeMeta) => {
      setActiveItem(item);
    };

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog dataSourcesDialog">
          <main>
            <header>
              <h1>
                <span>Data Sources</span>
                <i className="iconfont icon-iconInfo" onClick={onCheck}></i>
                {/* <img src={iconInfo} alt="" onClick={onCheck} /> */}
              </h1>
              <h2>PADO validates data authenticity through MPC-TLS.</h2>
            </header>
            <SourceGroups onChange={handleClickData} />
          </main>
          <PButton text="Select" onClick={handleClickNext}></PButton>
        </div>
      </PMask>
    );
  }
);

export default DataSourcesDialog;
