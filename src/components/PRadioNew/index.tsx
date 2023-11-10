import React, { useState, useEffect, memo, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import './index.scss';
import type { FilterOptionList } from '@/types/config';

interface TokenTableProps {
  onChange: (label: string | undefined) => void;
  list: FilterOptionList;
  type?: string;
}

const PRadioNew: React.FC<TokenTableProps> = memo(({ onChange, list,type ="radio"}) => {
  const [activeItem, setActiveItem] = useState<string | undefined>('All');

  const handleChange = (e: ChangeEvent<HTMLInputElement>, label?: string) => {
    // console.log(e, label)
    const curChecked = e.target.checked;
    if (curChecked) {
      const activeI = activeItem === label ? undefined : label;
      setActiveItem(activeI);
    } else {
      setActiveItem(undefined);
    }
  };
  useEffect(() => {
    onChange(activeItem);
  }, [activeItem, onChange]);
  useEffect(() => {
    const f: any = list.find((i) => i.defaultValue === true);
    if (f) {
      setActiveItem(f.label);
    }
  }, [list]);

  const formatIconClassName = useCallback(
    (item: any) => {
      let defaultCN = 'iconfont icon-iconCheckbox';
      if (item.disabled) {
        defaultCN += 'iconfont icon-iconCheckbox disabled';
      }
      if (activeItem === item.label) {
        defaultCN = 'iconfont icon-iconCheckboxActive checked';
      }
      return defaultCN;
    },
    [activeItem]
  );

  return (
    <ul className="pRadioNew">
      {list &&
        list.map((item) => {
          return (
            <li className="pRadioItemWrapper">
              <label
                className={
                  activeItem === item.label
                    ? 'pRadioItem checked'
                    : 'pRadioItem '
                }
                key={item.label}
              >
                <input
                  className="checkbox"
                  name="proof"
                  type={type}
                  defaultChecked={item.defaultValue}
                  disabled={item.disabled}
                  onChange={(e) => handleChange(e, item?.label)}
                />
                <i className={formatIconClassName(item)}></i>
                <div className="desc">{item.label}</div>
              </label>
            </li>
          );
        })}
    </ul>
  );
});

export default PRadioNew;
