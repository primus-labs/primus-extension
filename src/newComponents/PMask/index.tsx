import React, { memo } from 'react';
import './index.scss';
// import iconClose from '@/assets/img/iconClose.svg';

interface PMaskProps {
  children?: any;
  className?: string;
}

const PMask: React.FC<PMaskProps> = memo(({ children, className }) => {
  return (
    <div className={`pMask2 ${className}`}>
      {/* {closeable && (
        <img className="closeBtn" src={iconClose} alt="" onClick={onClose} />
      )} */}
      {/* {closeable && (
        <i className="iconfont icon-iconClose" onClick={onClose} />
      )} */}
      {children}
    </div>
  );
});

export default PMask;
