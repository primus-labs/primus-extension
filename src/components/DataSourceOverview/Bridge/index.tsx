import React,{memo} from 'react';
import iconUser from '@/assets/img/iconUser.svg';
import iconConnect from '@/assets/img/iconConnect.svg';
import './index.sass'

interface BridgeProps {
  startIcon?: any;
  endIcon: any;
}

const Bridge: React.FC<BridgeProps> = memo(({ startIcon = iconUser, endIcon }) => {
  return (
    <div className="bridgeWrapper">
      <div className="from">
        <img src={startIcon} alt="" />
      </div>
      <img className="connectSymbol" src={iconConnect} alt="" />
      <div className="to">
        <img src={endIcon} alt="" />
      </div>
    </div>
  );
});

export default Bridge;
