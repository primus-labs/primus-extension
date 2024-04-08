import React, { memo, useMemo, useCallback } from 'react';
import './index.scss';
interface PBackProps {
  list: any[];
  max?: number;
  onClick?: (k: number) => void;
}
const SplicedIcons: React.FC<PBackProps> = memo(
  ({ list, max = 5, onClick }) => {
    const formatList = useMemo(() => {
      const newList = list.slice(0, max);
      return newList;
    }, [list, max]);
    const handleClick = useCallback((e, k) => {
      e.stopPropagation();
      onClick && onClick(k);
    }, []);
    return (
      <div className="splicedIcons">
        {formatList.map((i, k) => {
          return (
            <img
              src={i}
              alt=""
              key={k}
              onClick={(e) => {
                handleClick(e, k);
              }}
            />
          );
        })}
        {list.length > max && (
          <div className="hideCircle">+{list.length - formatList.length}</div>
        )}
      </div>
    );
  }
);

export default SplicedIcons;
