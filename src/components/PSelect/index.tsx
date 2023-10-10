import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useSelector } from 'react-redux';

import iconArrowBottom from '@/assets/img/iconArrowLeft2.svg';
import iconClear from '@/assets/img/iconClear.svg';

import type { MouseEvent } from 'react';
import type { UserState } from '@/types/store';

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
  prefix?: any;
  showSelf?: boolean;
}

const PSelect: React.FC<PSelectProps> = memo(
  ({
    onChange,
    options,
    placeholder = '',
    val,
    showIcon,
    prefix,
    showSelf = true,
  }) => {
    // const [activeOption, setActiveOption] = useState<OptionItem>();
    const [optionsVisible, setOptionsVisible] = useState(false);

    const sysConfig = useSelector((state: UserState) => state.sysConfig);

    const tokenLogoPrefix = useMemo(() => {
      return sysConfig.TOKEN_LOGO_PREFIX;
    }, [sysConfig]);
    const activeOptions = useMemo(() => {
      if (showSelf) {
        return options;
      } else {
        return options.filter((i) => i.value !== val);
      }
    }, [options, showSelf, val]);

    const selectInputEl = useRef(null);
    const prefixIconEl = useRef(null);
    const suffixIconEl = useRef(null);
    const valEl = useRef(null);

    const handleChange = (item: OptionItem | undefined) => {
      // setActiveOption(item)
      onChange(item?.value ?? '');
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
        if (
          ev.target !== selectInputEl.current &&
          ev.target !== prefixIconEl.current &&
          ev.target !== suffixIconEl.current &&
          ev.target !== valEl.current
        ) {
          setOptionsVisible(false);
        }
      };
      dE.addEventListener('click', dEClickHandler);
      return () => {
        dE.removeEventListener('click', dEClickHandler);
      };
    }, []);
    const activeClassName = useMemo(() => {
      let defaultCN = 'selectInput';
      if (showIcon) {
        defaultCN += ' hasIcon';
      }
      if (activeOptions.length > 0) {
        defaultCN += ' active';
      }
      return defaultCN;
    }, [showIcon, activeOptions]);

    return (
      <div className="pSelect">
        <div
          ref={selectInputEl}
          className={activeClassName}
          onClick={handleEnterAvatar}
          onMouseEnter={handleEnterAvatar}
          onMouseLeave={handleLeaveAvatar}
        >
          {val && showIcon && (
            <img
              ref={prefixIconEl}
              className="prefixIcon"
              src={`${tokenLogoPrefix}icon${val}.png`}
              alt=""
            />
          )}

          <span ref={valEl} className={val ? '' : 'placeholder'}>
            {val && prefix && prefix}
            {val ? val : 'Select'}
          </span>

          {val && showIcon ? (
            <img
              ref={suffixIconEl}
              className="suffixIcon"
              src={iconClear}
              alt=""
              onClick={() => handleChange(undefined)}
            />
          ) : (
            <img
              ref={suffixIconEl}
              className={
                optionsVisible ? 'suffixIcon arrow open' : 'suffixIcon arrow'
              }
              src={iconArrowBottom}
              alt=""
            />
          )}
        </div>
        {optionsVisible && activeOptions.length > 0 && (
          <div
            className="selectOptionswrapper"
            onClick={handleEnterAvatar}
            onMouseEnter={handleEnterAvatar}
            onMouseLeave={handleLeaveAvatar}
          >
            <ul className="selectOptions">
              {activeOptions.map((item) => {
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
  }
);

export default PSelect;
