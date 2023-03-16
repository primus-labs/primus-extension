import React from 'react';
import type { ChangeEvent } from 'react'
import './index.sass'

interface PInputProps {
  onChange: (val:string) => void;
  type: 'text' | 'password'
}

const PHeader:React.FC<PInputProps> = ({onChange, type="text"}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatVal = e.target.value.trim()
    onChange(formatVal)
  }
  return (
    <input type={type} className="pInput" onChange={handleChange}/>
  );
};

export default PHeader;
