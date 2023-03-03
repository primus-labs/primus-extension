import React from 'react';
import './index.sass'
import iconClose from '@/assets/img/iconClose.svg';
const PHeader = (props) => {
  const handleClickClose = () => {
    props.onClose()
  }
  return (
    <div className="pMask bgLayer">
      <img className="closeBtn" src={iconClose} alt="close" onClick={handleClickClose}/>
    </div>
  );
};

export default PHeader;
