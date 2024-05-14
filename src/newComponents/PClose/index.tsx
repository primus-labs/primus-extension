import React, { memo } from 'react';
import PButton from '@/newComponents/PButton'
import './index.scss';
interface PBackProps {
  onClick: () => void;
}
const PClose: React.FC<PBackProps> = memo(({ onClick }) => {
  return (
    <div className="PClose">
      <PButton
        className="closeBtn"
        type="icon"
        icon={<i className="iconfont icon-iconClose"></i>}
        onClick={onClick}
      />
      {/* <i className="iconfont icon-iconClose" onClick={onClose}></i> */}
    </div>
  );
});

export default PClose;
