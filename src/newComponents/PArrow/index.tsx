import React, { memo, useCallback, useState } from 'react';
import PButton from '@/newComponents/PButton';
import './index.scss';
interface PArrowProps {
  onClick: () => void;
  // open?: boolean;
}
const PArrow: React.FC<PArrowProps> = memo(({ onClick }) => {
  const [active, setActive] = useState<boolean>(false);
  const handleClick = useCallback(() => {
    setActive((a) => !a);
    onClick();
  }, [onClick]);
  return (
    <div className="pArrow">
      <PButton
        className="arrowBtn"
        type="icon"
        icon={
          <i className={`iconfont icon-DownArrow ${active && 'rotate'}`}></i>
        }
        onClick={onClick}
      />
    </div>
  );
});

export default PArrow;
