import React, { useState, useRef, useMemo, memo } from 'react';
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
  labelExtra?: any;
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
    labelExtra,
  }) => {
    const inputEl = useRef<any>(null);
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
    return (
      <div className="pInputWrapper">
        {label && <label>{label}</label>}
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
      </div>
    );
  }
);

export default PInput;
