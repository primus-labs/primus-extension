import React, { memo } from 'react';
import './index.sass';
import iconClose from '@/assets/img/iconClose.svg';

interface PMaskProps {
  onClose: () => void;
  children?: any;
}

const PMask: React.FC<PMaskProps> = memo(({ onClose, children }) => {
  return (
    <div className="pMask bgLayer">
      <img className="closeBtn" src={iconClose} alt="" onClick={onClose} />
      {children}
    </div>
  );
});

export default PMask;
