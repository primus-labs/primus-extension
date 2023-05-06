import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import type { TokenMap } from '@/components/DataSourceOverview/DataSourceItem';
// import PInput from '@/components/PInput'
import './index.sass';

interface TokenTableProps {
  // list: TokenMap[] | DataSourceItemType[];
  // type?: string;
  // flexibleAccountTokenMap?: any;
  // spotAccountTokenMap?: any;
  // name?:string;
  onChange: (label: string | undefined) => void;
  // onClose?: () => void;
  visible: boolean;
}
const list = [
  {
    label: 'All',
    disabled: false,
    defaultValue: true,
  },
  {
    label: 'Spot',
    disabled: false,
    defaultValue: false,
  },
  {
    label: 'Flexible',
    disabled: false,
    defaultValue: false,
  },
];
const PFilterContent: React.FC<TokenTableProps> = ({onChange, visible}) => {
  const willCloseEl = useRef(null)
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
    onChange(activeItem)
  }, [activeItem])
  
  // useEffect(() => {
  //   setActiveItem('All');
  // }, [])
  
  return (
    <section className={visible? "pFilterContent visible":"pFilterContent"} ref={willCloseEl}>
        <ul className="formItems">
          {list &&
            list.map((item) => {
              return (
                <label className="formItem" key={item.label}>
                  <input
                    className="checkbox"
                    name="proof"
                    type="radio"
                    defaultChecked={item.defaultValue}
                    disabled={item.disabled}
                    onChange={(e) => handleChange(e, item.label)}
                  />
                  <div
                    className={
                      item.disabled
                        ? 'iconCheckedWrapper disabled'
                        : activeItem === item.label
                        ? 'iconCheckedWrapper checked'
                        : 'iconCheckedWrapper'
                    }
                  ></div>
                  <div className="descItem">
                    <div className="label">{item.label}</div>
                  </div>
                </label>
              );
            })}
        </ul>
    </section>
  );
};

export default PFilterContent;
