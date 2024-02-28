import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  memo,
  useCallback,
} from 'react';
import { useSelector } from 'react-redux';
import PDropdown from '../PDropdown';
// import iconClear from '@/assets/img/iconClear.svg';

import type { MouseEvent } from 'react';
import type { UserState } from '@/types/store';

import './index.scss';

type OptionItem = {
  iconName?: any;
  label?: any;
  value?: any;
  disabled?: boolean;
  tooltip?: string;

  icon?: any;
};
interface PSelectProps {
  list: OptionItem[];
  onChange: (value: any, item: OptionItem) => void;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  prefix?: any;
  label?: any;
  className?: string;
  align?: string;

  showIcon?: boolean;
  showSelf?: boolean;
}

const PSelect: React.FC<PSelectProps> = memo(
  ({
    onChange,
    list,
    placeholder = 'Select',
    value,
    showIcon,
    prefix,
    showSelf = true,
    disabled = false,
    label,
    className,
    align = 'vertical',
  }) => {
    const [optionsVisible, setOptionsVisible] = useState(true);

    const selectInputEl = useRef(null);
    const prefixIconEl = useRef(null);
    const suffixIconEl = useRef(null);
    const valEl = useRef(null);

    const activeOption = useMemo(() => {
      const obj = list.find((i) => i.value === value);
      return obj;
    }, [list, value]);
    const activeOptions = useMemo(() => {
      if (showSelf) {
        return list;
      } else {
        return list.filter((i) => i.value !== value);
      }
    }, [list, value, showSelf]);
    const isOpen = useMemo(() => {
      return optionsVisible && !disabled && activeOptions.length > 0;
    }, [optionsVisible, disabled, activeOptions.length]);
    const formatSelectCN = useMemo(() => {
      let defaultCN = 'selectInput';
      if (showIcon) {
        defaultCN += ' hasIcon';
      }
      if (activeOptions.length > 0 && !disabled) {
        defaultCN += ' toBeActive';
      }
      if (isOpen) {
        defaultCN += ' active';
      }
      if (disabled) {
        defaultCN += ' disabled';
      }
      return defaultCN;
    }, [showIcon, activeOptions, disabled, isOpen]);
    const formatSuffixCN = useMemo(() => {
      let str = 'iconfont icon-DownArrow suffixIcon arrow';
      if (optionsVisible && !disabled) {
        str += ' open';
      }
      return str;
    }, [optionsVisible, disabled]);
    const formatPSelectCN = useMemo(() => {
      let cN = 'PSelect';
      if (disabled) {
        cN += ' disabled';
      }
      if (className) {
        cN += ` ${className}`;
      }
      if (align) {
        cN += ` ${align}`;
      }
      return cN;
    }, [disabled, className, align]);

    const handleClickDropdownItem = useCallback(
      (value: string, item) => {
        onChange(value, item);
      },
      [onChange]
    );
    const handleEnter = () => {
      setOptionsVisible(true);
    };
    const handleLeave = () => {
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

    return (
      <div className={formatPSelectCN}>
        {label && (
          <label>
            <span>{label}</span>
          </label>
        )}
        <div
          ref={selectInputEl}
          className={formatSelectCN}
          onClick={handleEnter}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {prefix}
          <div className="valueWrapper">
            {value ? (
              <>
                {activeOption?.iconName ? (
                  <i className={`iconfont ${activeOption.iconName}`}></i>
                ) : activeOption?.icon ? (
                  <img src={activeOption.icon} alt="" className="iconImg" />
                ) : undefined}
                <span ref={valEl} className={''}>
                  {activeOption?.label}
                </span>
              </>
            ) : (
              <span ref={valEl} className={'placeholder'}>
                {placeholder}
              </span>
            )}
          </div>
          <i ref={suffixIconEl} className={formatSuffixCN} />
        </div>
        {isOpen && (
          <div
            className={
              label ? 'selectOptionswrapper withLabel' : 'selectOptionswrapper'
            }
            onClick={handleEnter}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            <PDropdown list={activeOptions} onClick={handleClickDropdownItem} value={!showSelf && value} />
          </div>
        )}
      </div>
    );
  }
);

export default PSelect;
