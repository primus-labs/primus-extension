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
  }) => {
    const [optionsVisible, setOptionsVisible] = useState(false);

    const selectInputEl = useRef(null);
    const prefixIconEl = useRef(null);
    const suffixIconEl = useRef(null);
    const valEl = useRef(null);

    const activeOptions = useMemo(() => {
      return list.filter((i) => i.value !== value);
    }, [list, value]);
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
      return cN;
    }, [disabled, className]);

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
            <span ref={valEl} className={value ? '' : 'placeholder'}>
              {value ? value : placeholder}
            </span>
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
            <PDropdown list={activeOptions} onClick={handleClickDropdownItem} />
          </div>
        )}
      </div>
    );
  }
);

export default PSelect;
