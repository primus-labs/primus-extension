import React, { useState, useRef, useMemo } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import iconCopy from '@/assets/img/iconCopy.svg';
import iconCompleted from '@/assets/img/iconCompleted.svg';
import iconEye from '@/assets/img/iconEye.svg';
import iconCloseEye from '@/assets/img/iconCloseEye.svg';

import './index.sass';

interface PInputProps {
  onChange: (val: string) => void;
  type?: 'text' | 'password';
  placeholder?: string;
  copiable?: boolean;
  visible?: boolean;
  onSearch?: (val: string) => void;
}

const PInput: React.FC<PInputProps> = ({
  onChange,
  type = 'text',
  placeholder = '',
  copiable = false,
  visible = false,
  onSearch
}) => {
  const inputEl = useRef<any>(null);
  const [copied, setCopied] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false)
  const activeType = useMemo(() => {
    if (visible) {
      return open ? 'text' : 'password'
    } else {
      return type
    }
  }, [open, visible, type])
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatVal = e.target.value.trim();
    onChange(formatVal);
  };
  const handleCopy = () => {
    navigator.clipboard.writeText(inputEl.current?.value);
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }
  const handleLookPwd = () => {
    setOpen(open => !open)
  }
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 13) {
      const formatVal = (e.target as HTMLInputElement).value.trim();
      onSearch && onSearch(formatVal)
    }
  }

  return (
    <div className="pInputWrapper">
      <input
        ref={inputEl}
        type={activeType}
        className="pInput"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      {copiable &&
        <img className="suffixIcon" src={copied ? iconCompleted : iconCopy} alt="" onClick={handleCopy} />}
      {visible &&
        <img className="suffixIcon" src={activeType === 'password' ? iconCloseEye : iconEye} alt="" onClick={handleLookPwd} />}
    </div>
  );
};

export default PInput;
