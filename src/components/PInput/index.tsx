import React, { useState, useRef, useMemo, memo, useEffect } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import './index.scss';

interface PInputProps {
  onChange: (val: string) => void;
  type?: 'text' | 'password';
  placeholder?: string;
  copiable?: boolean;
  visible?: boolean;
  onSearch?: (val: string) => void;
  label?: string;
  tooltip?: any;
  value?: string;
  errorTip?: any;
}

const PInput: React.FC<PInputProps> = memo(
  ({
    onChange,
    type = 'text',
    placeholder = '',
    copiable = false,
    visible = false,
    onSearch,
    label,
    tooltip,
    value,
    errorTip,
  }) => {
    const inputEl = useRef<any>(null);
    const [val, setVal] = useState<string>('');
    const [copied, setCopied] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);
    const activeType = useMemo(() => {
      if (visible) {
        return open ? 'text' : 'password';
      } else {
        return type;
      }
    }, [open, visible, type]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const formatVal = e.target.value.trim();
      onChange(formatVal);
    };
    const handleCopy = () => {
      navigator.clipboard.writeText(inputEl.current?.value);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    };
    const handleLookPwd = () => {
      setOpen((open) => !open);
    };
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.keyCode === 13) {
        const formatVal = (e.target as HTMLInputElement).value.trim();
        onSearch && onSearch(formatVal);
      }
    };
    const onClickTooltip = () => {
      if (tooltip?.link) {
        if (tooltip.link.startsWith('http')) {
          window.open(tooltip.link);
        }
      }
    };
    useEffect(() => {
      if (value !== null && value !== undefined) {
        setVal(value);
      }
    }, [value]);
    return (
      <div className="pInputWrapper">
        {label && (
          <label>
            <span>{label}</span>
            {tooltip && (
              <i
                className="iconfont icon-iconTooltip"
                onClick={onClickTooltip}
              />
            )}
          </label>
        )}
        <div className="inputWrapper">
          <input
            ref={inputEl}
            type={activeType}
            className="pInput"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
          {copiable && (
            <i
              className={
                copied
                  ? 'iconfont icon-iconCompleted'
                  : 'iconfont icon-iconCCCopy'
              }
              onClick={handleCopy}
            ></i>
          )}
          {visible && (
            <i
              className={
                activeType === 'password'
                  ? 'iconfont icon-iconCloseEye'
                  : 'iconfont icon-iconEye'
              }
              onClick={handleLookPwd}
            ></i>
          )}
        </div>
        {errorTip && <div className="errorTip">{errorTip}</div>}
      </div>
    );
  }
);

export default PInput;
