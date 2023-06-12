import React, { useState } from 'react';
import iconCopy from '@/assets/img/iconCopy.svg';
import iconCompleted from '@/assets/img/iconCompleted.svg';
import './index.sass';
import { div } from '@/utils/utils';

interface PCopyProps {
  text: string;
}

const PCopy: React.FC<PCopyProps> = ({ text }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  return (
    <div className="pCopy">
      <img
        className={copied ? 'iconCopied' : 'iconCopy'}
        src={copied ? iconCompleted : iconCopy}
        alt=""
        onClick={handleCopy}
      />
    </div>
  );
};

export default PCopy;
