import React, { memo } from 'react';
import PButton from '@/newComponents/PButton';
import './index.scss';
interface PStarProps {
  onClick: () => void;
  open?: boolean;
}
const PStar: React.FC<PStarProps> = memo(({ onClick, open = false }) => {
  return (
    <div className="PStar">
      <PButton
        className="starBtn"
        type="icon"
        icon={
          <i
            className={
              open ? 'iconfont icon-iconColoredStar' : 'iconfont icon-iconStar'
            }
          ></i>
        }
        onClick={onClick}
      />
    </div>
  );
});

export default PStar;
