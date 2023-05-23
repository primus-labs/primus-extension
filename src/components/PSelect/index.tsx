import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { MouseEvent } from 'react';
import { useSelector } from 'react-redux';
import type { UserState } from '@/store/reducers';

import './index.sass';

type OptionItem = {
  text: string;
  value: string;
  icon?: string;
};
interface PSelectProps {
  options: OptionItem[];
  onChange: (val: string) => void;
  placeholder?: string;
  val: string;
  showIcon?: boolean;
}

const PSelect: React.FC<PSelectProps> = ({
  onChange,
  options,
  placeholder = '',
  val,
  showIcon,
}) => {
  // const [activeOption, setActiveOption] = useState<OptionItem>();
  const [optionsVisible, setOptionsVisible] = useState(false);
  const sysConfig = useSelector((state: UserState) => state.sysConfig);
  const tokenLogoPrefix = useMemo(() => {
    return sysConfig.TOKEN_LOGO_PREFIX;
  }, [sysConfig]);
  const selectInputEl = useRef(null);
  const handleChange = (item: OptionItem) => {
    // setActiveOption(item)
    onChange(item.value);
  };
  const handleClickSelect = () => {
    setOptionsVisible((visible) => !visible);
  };
  const handleEnterAvatar = () => {
    setOptionsVisible(true);
  };
  const handleLeaveAvatar = () => {
    setOptionsVisible(false);
  };
  useEffect(() => {
    const dE = document.documentElement;
    const dEClickHandler: any = (ev: MouseEvent<HTMLElement>) => {
      if (ev.target !== selectInputEl.current) {
        setOptionsVisible(false);
      }
    };
    dE.addEventListener('click', dEClickHandler);
    return () => {
      dE.removeEventListener('click', dEClickHandler);
    };
  }, []);

  return (
    <div className="pSelect">
      <div
        ref={selectInputEl}
        className="selectInput"
        onMouseEnter={handleEnterAvatar}
        onMouseLeave={handleLeaveAvatar}
      >
        {showIcon && <img src={`${tokenLogoPrefix}icon${val}.png`} alt="" />}
        <span>{val}</span>
      </div>
      {optionsVisible && (
        <div
          className="selectOptionswrapper"
          onMouseEnter={handleEnterAvatar}
          onMouseLeave={handleLeaveAvatar}
        >
          <ul className="selectOptions">
            {options.map((item) => {
              return (
                <li
                  className="selectOption"
                  key={item.value}
                  onClick={() => handleChange(item)}
                >
                  {showIcon && <img src={item.icon} alt="" />}
                  <span>{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PSelect;
