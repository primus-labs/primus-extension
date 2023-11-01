import React, { useState, useRef, useEffect, memo ,useCallback} from 'react';
import type { ChangeEvent } from 'react';
import './index.scss';
import type {FilterOptionList} from '@/types/config'

interface TokenTableProps {
  onChange: (label: string | undefined) => void;
  visible: boolean;
  list: FilterOptionList;
}

const PFilterContent: React.FC<TokenTableProps> = memo(
  ({ onChange, visible, list }) => {
    const willCloseEl = useRef(null);
    const [activeItem, setActiveItem] = useState<string | undefined>('All');

    const handleChange = (e: ChangeEvent<HTMLInputElement>, label: string) => {
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
    }, [activeItem]);

    // useEffect(() => {
    //   setActiveItem('All');
    // }, [])
    const formatIconClassName = useCallback((item:any) => {
      let defaultCN = 'iconfont icon-iconCheckbox';
      if (item.disabled) {
        defaultCN += 'iconfont icon-iconCheckbox disabled';
      }
      if (activeItem === item.label) {
        defaultCN = 'iconfont icon-iconCheckboxActive checked';
      }
      return defaultCN;
    }, [activeItem]);

    return (
      <section
        className={visible ? 'pFilterContent visible' : 'pFilterContent'}
        ref={willCloseEl}
      >
        <ul className="formItems padodropdown">
          {list &&
            list.map((item) => {
              return (
                <li className="dropdownItemWrapper">
                  <label
                    className={
                      activeItem === item.label
                        ? 'formItem dropdownItem checked'
                        : 'formItem dropdownItem'
                    }
                    key={item.label}
                  >
                    <input
                      className="checkbox"
                      name="proof"
                      type="radio"
                      defaultChecked={item.defaultValue}
                      disabled={item.disabled}
                      onChange={(e) => handleChange(e, item.label)}
                    />
                    <i className={formatIconClassName(item)}></i>
                    <div className="desc">{item.label}</div>
                  </label>
                </li>
              );
            })}
        </ul>
      </section>
    );
  }
);

export default PFilterContent;
