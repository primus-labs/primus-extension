import React, { memo } from 'react';
import PButton from '@/newComponents/PButton'
import './index.scss';
interface PBackProps {
  onClick: () => void;
  open?: boolean;
}
const PClose: React.FC<PBackProps> = memo(({ onClick, open = false }) => {
  return (
    <div className="PEye">
      <PButton
        className="closeBtn"
        type="icon"
        icon={
          <i
            className={
              open ? 'iconfont icon-EyeOpen' : 'iconfont icon-EyeClose'
            }
          ></i>
        }
        onClick={onClick}
      />

      {/* <i className="iconfont icon-iconClose" onClick={onClose}></i> */}
    </div>
  );
});

export default PClose;
