import React, { useState, useMemo } from 'react';
import PMask from '@/components/PMask';
import { DATASOURCEMAP } from '@/config/constants';
import type { ExchangeMeta } from '@/config/constants';
import iconInfo from '@/assets/img/iconInfo.svg';
import './index.sass';

export type DataFieldItem = {
  icon: any;
  name: string;
  type: string;
  desc?: string;
  requirePassphase?: boolean;
};
interface DataSourcesDialogProps {
  onClose: () => void;
  onSubmit: (item: DataFieldItem) => void;
  onCheck: () => void;
  // onCancel: () => void
}
const DataSourcesDialog: React.FC<DataSourcesDialogProps> = ({
  onClose,
  onSubmit,
  onCheck,
}) => {
  const [activeItem, setActiveItem] = useState<DataFieldItem>();
  const list: DataFieldItem[] = useMemo(() => {
    return Object.keys(DATASOURCEMAP).map((key) => {
      const sourceInfo: ExchangeMeta =
        DATASOURCEMAP[key as keyof typeof DATASOURCEMAP];
      const { name, icon, type, requirePassphase } = sourceInfo;
      const infoObj: DataFieldItem = {
        name,
        icon,
        type,
        desc: `${type} Data`, // TODO tooltip style
        requirePassphase,
      };
      return infoObj;
    });
  }, []);

  const handleClickNext = () => {
    if (!activeItem) {
      return;
    }
    onSubmit(activeItem);
  };

  const handleClickData = (item: DataFieldItem) => {
    setActiveItem(item);
  };

  return (
    <PMask onClose={onClose}>
      <div className="padoDialog dataSourcesDialog">
        <main>
          <h1>
            <span>Data Sources</span>
            <img src={iconInfo} alt="" onClick={onCheck} />
          </h1>
          <h2>
            Select a platform to connect, and let PADO validate your data
            authenticity.
          </h2>
          <div className="scrollList">
            <ul className="dataList">
              {list.map((item) => {
                return (
                  <li
                    className={
                      activeItem?.name === item.name
                        ? 'networkItem active'
                        : 'networkItem'
                    }
                    key={item.name}
                    onClick={() => {
                      handleClickData(item);
                    }}
                  >
                    <img src={item.icon} alt="" />
                    <div className="desc" title={item.desc}>
                      {item.desc}
                    </div>
                    <h6>{item.name}</h6>
                  </li>
                );
              })}
            </ul>
          </div>
        </main>
        <button className="nextBtn" onClick={handleClickNext}>
          Select
        </button>
      </div>
    </PMask>
  );
};

export default DataSourcesDialog;
