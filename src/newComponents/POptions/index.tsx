import React, { useState, useCallback, memo } from 'react';
import { WALLETLIST } from '@/config/wallet';
import type { SyntheticEvent } from 'react';
import type { newWALLETITEMTYPE, WALLETMAPTYPE } from '@/types/config';

import './index.scss';
import POptions from '@/newComponents/POptions';


interface DataSourcesDialogProps {
  onClick: (item?: newWALLETITEMTYPE, val?: string | number) => void;
  list?: newWALLETITEMTYPE[];
}

const POptions: React.FC<DataSourcesDialogProps> = memo(
  ({ onClick, list = WALLETLIST }) => {
    const [activeItem, setActiveItem] = useState<newWALLETITEMTYPE>();
    const liClassName = useCallback(
      (item: newWALLETITEMTYPE) => {
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

    const handleClickData = (e: SyntheticEvent, item) => {
      e.stopPropagation();
      if (!item.disabled) {
        // if (item.name === activeItem?.name) {
        //   setActiveItem(undefined);
        //   onClick(undefined);
        // } else {
        setActiveItem(item);
        onClick(item, item.id || item.value);
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

export default POptions;
