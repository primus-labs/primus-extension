import React, { useState, useRef, useMemo, memo, useEffect } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import './index.scss';

interface PInputProps {
  onChange: (val: string) => void;
  type?: 'text' | 'password';
  placeholder?: string;
  label?: string;
  value?: string;
  errorTip?: any;
  helpTip?: any;
  disabled?: boolean;
  prefix?: any;
  className?: string;

  copiable?: boolean;
  onSearch?: (val: string) => void;
  tooltip?: any;
}

const PInput: React.FC<PInputProps> = memo(
  ({
    onChange,
    type = 'text',
    placeholder = '',
    onSearch,
    label,
    value,
    errorTip,
    helpTip,
    disabled = false,
    copiable = false,
    tooltip,
    prefix,
    className,
  }) => {
    const inputEl = useRef<any>(null);
    const [val, setVal] = useState<string>('');
    const [copied, setCopied] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);
    const visible = useMemo(() => {
      return type === 'password';
    }, [type]);
    const formatCN = useMemo(() => {
      let cN = 'PInputWrapper';
      if (disabled) {
        cN += ' disabled';
      }
      if (!!errorTip) {
        cN += ' error';
      }
      if (className) {
        cN += ` ${className}`;
      }
      return cN;
    }, [disabled, errorTip, className]);
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
    // const handleCopy = () => {
    //   navigator.clipboard.writeText(inputEl.current?.value);
    //   setCopied(true);
    //   setTimeout(() => {
    //     setCopied(false);
    //   }, 2000);
    // };
    const handleLookPwd = () => {
      setOpen((open) => !open);
    };
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.keyCode === 13) {
        const formatVal = (e.target as HTMLInputElement).value.trim();
        onSearch && onSearch(formatVal);
      }
    };
    // const onClickTooltip = () => {
    //   if (tooltip?.link) {
    //     if (tooltip.link.startsWith('http')) {
    //       window.open(tooltip.link);
    //     }
    //   }
    // };
    useEffect(() => {
      if (value !== null && value !== undefined) {
        setVal(value);
      }
    }, [value]);
    return (
      <div className={formatCN}>
        {label && (
          <label>
            <span>{label}</span>
            {/* {tooltip && (
              <i
                className="iconfont icon-iconTooltip"
                onClick={onClickTooltip}
              />
            )} */}
          </label>
        )}
        <div className="inputWrapper">
          {prefix}
          <input
            className="pInput"
            ref={inputEl}
            type={activeType}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            value={value}
          />
          {/* {copiable && (
            <i
              className={
                copied
                  ? 'iconfont icon-iconCompleted'
                  : 'iconfont icon-iconCCCopy'
              }
              onClick={handleCopy}
            ></i>
          )} */}
          {visible && (
            <i
              className={
                activeType === 'password'
                  ? 'iconfont icon-EyeClose'
                  : 'iconfont icon-EyeOpen'
              }
              onClick={handleLookPwd}
            ></i>
          )}
        </div>
        {errorTip && <div className="tip error">{errorTip}</div>}
        {helpTip && <div className="tip help">{helpTip}</div>}
      </div>
    );
  }
);

export default PInput;
