import React, { useState, useRef, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import iconCopy from '@/assets/img/iconCopy.svg';
import iconCompleted from '@/assets/img/iconCompleted.svg';
import iconEye from '@/assets/img/iconEye.svg';

import './index.sass';

interface PInputProps {
  onChange: (val: string) => void;
  type?: 'text' | 'password';
  placeholder?: string;
  copiable?: boolean;
  visible?: boolean;
}

const PInput: React.FC<PInputProps> = ({
  onChange,
  type = 'text',
  placeholder = '',
  copiable = false,
  visible = false
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

  return (
    <div className="pInputWrapper">
      <input
        ref={inputEl}
        type={activeType}
        className="pInput"
        onChange={handleChange}
        placeholder={placeholder}
      />
      {copiable &&
        <img className="suffixIcon" src={copied ? iconCompleted : iconCopy} alt="" onClick={handleCopy} />}
      {visible &&
        <img className="suffixIcon" src={iconEye} alt="" onClick={handleLookPwd} />}
    </div>
  );
};

export default PInput;
