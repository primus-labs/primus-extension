import React, { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import iconCopy from '@/assets/img/iconCopy.svg';
import iconCompleted from '@/assets/img/iconCompleted.svg';
import './index.sass';

interface PInputProps {
  onChange: (val: string) => void;
  type?: 'text' | 'password';
  placeholder?: string;
  copiable?: boolean
}

const PInput: React.FC<PInputProps> = ({
  onChange,
  type = 'text',
  placeholder = '',
  copiable = false
}) => {
  const inputEl = useRef<any>(null);
  const [copied, setCopied] = useState<boolean>(false)
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatVal = e.target.value.trim();
    onChange(formatVal);
  };
  const handleCopy = () => {
    // if (navigator?.clipboard?.writeText)
    navigator.clipboard.writeText(inputEl.current?.value);
    // return Promise.reject('The Clipboard API is not available.');
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)

  }

  return (
    <div className="pInputWrapper">
      <input
        ref={inputEl}
        type={type}
        className="pInput"
        onChange={handleChange}
        placeholder={placeholder}
      />
      {copiable &&
        <img className="suffixIcon" src={copied ? iconCompleted : iconCopy} alt="" onClick={handleCopy} />}
    </div>
  );
};

export default PInput;
