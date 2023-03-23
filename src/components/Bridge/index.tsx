import React from 'react';
import './index.sass'
import iconB from '@/assets/img/iconB.svg';
import iconUser from '@/assets/img/iconUser.svg';
import iconConnect from '@/assets/img/iconConnect.svg';

interface BridgeProps {

}

const Bridge: React.FC<BridgeProps> = () => {
  return (
    <div className="bridgeWrapper">
      <img className="from" src={iconUser} alt="" />
      <img className="connectSymbol" src={iconConnect} alt="" />
      <img className="to" src={iconB} alt="" />
    </div>
  );
};

export default Bridge;
