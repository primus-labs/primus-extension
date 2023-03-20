import React from 'react';
import type { ChangeEvent } from 'react'
import PInput from '@/components/PInput'
import './index.sass'

interface PInputProps {
  onChange: (val: string) => void;
  type: 'text' | 'password'
}

const PHeader: React.FC<PInputProps> = ({ onChange, type = "text" }) => {

  const handleChange = (val: string) => {

  }

  return (
    <div className="pSearch">
      <PInput onChange={handleChange} type="text" />
    </div>
  );
};

export default PHeader;
