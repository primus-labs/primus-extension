import React, { useState, useCallback, memo } from 'react';
import { WALLETLIST } from '@/config/wallet';
import type { WALLETITEMTYPE } from '@/config/constants';
import type { SyntheticEvent } from 'react';
import './index.scss';

export type DataFieldItem = {
  icon: any;
  name: string;
  id: string;
  type?: string;
  desc?: string;
  requirePassphase?: boolean;
};
interface DataSourcesDialogProps {
  onClick: (item?: WALLETITEMTYPE) => void;
  list?: WALLETITEMTYPE[];
}

const WalletList: React.FC<DataSourcesDialogProps> = memo(
  ({ onClick, list = WALLETLIST }) => {
    const [activeItem, setActiveItem] = useState<WALLETITEMTYPE>();
    const liClassName = useCallback(
      (item: WALLETITEMTYPE) => {
        let defaultClassName = 'pOption';
        if (item.disabled) {
          defaultClassName += ' disabled';
        }
        if (activeItem?.name === item.name) {
          defaultClassName += ' active';
        }
        return defaultClassName;
      },
      [activeItem]
    );

    const handleClickData = (e: SyntheticEvent, item: WALLETITEMTYPE) => {
      e.stopPropagation();
      if (!item.disabled) {
        // if (item.name === activeItem?.name) {
        //   setActiveItem(undefined);
        //   onClick(undefined);
        // } else {
          setActiveItem(item);
          onClick(item);
        // }
      }
    };

    return (
      <div className="pOptionsWrapper">
        <ul className="pOptions">
          {list.map((item) => {
            return (
              <li
                className={liClassName(item)}
                key={item.name}
                onClick={(e) => {
                  handleClickData(e, item);
                }}
              >
                <div className="optionInfo">
                  <img src={item.icon} alt="" className="icon" />
                  <div className="name">{item.name}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
);

export default WalletList;
