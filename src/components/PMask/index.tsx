import React from 'react';
import './index.sass'
import iconClose from '@/assets/img/iconClose.svg';

interface PMaskProps {
  onClose: () => void;
  children?: any
}

const PHeader: React.FC<PMaskProps> = (props) => {
  const handleClickClose = () => {
    props.onClose()
  }
  return (
    <div className="pMask bgLayer">
      <img className="closeBtn" src={iconClose} alt="" onClick={handleClickClose} />
      {props.children}
    </div>
  );
};

export default PHeader;
