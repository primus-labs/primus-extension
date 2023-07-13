import React, { memo } from 'react';
import './index.sass';
import iconClose from '@/assets/img/iconClose.svg';

interface PMaskProps {
  onClose: () => void;
  children?: any;
  closeable?: boolean;
}

const PMask: React.FC<PMaskProps> = memo(({ onClose, children, closeable =true }) => {
  return (
    <div className="pMask bgLayer">
      {closeable && <img className="closeBtn" src={iconClose} alt="" onClick={onClose} />}
      {children}
    </div>
  );
});

export default PMask;
