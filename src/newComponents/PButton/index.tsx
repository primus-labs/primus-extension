import React, { memo, useMemo } from 'react';
import type { SyntheticEvent } from 'react';
import './index.scss';

interface PButtonProps {
  prefix?: any;
  suffix?: any;

  className?: string;
  type?: string;
  text?: string;
  size?: string;
  icon?: any;
  onClick: () => void;
}
// how to use: <PPButton text="Connect" type="text"  className="disable"/>
const PButton: React.FC<PButtonProps> = memo(
  ({
    prefix,
    suffix,
    text,
    onClick,
    className,
    type = 'primary',
    icon,
    size = 'm',
  }) => {
    const formatClassName = useMemo(() => {
      let defaultCN = 'PButton';
      // if (className) {
      //   defaultCN += ' ' + className;
      // }
      // if (type === 'primary') {
      //   defaultCN += ' primary';
      //   if (size === 'm') {
      //     defaultCN += ' m';
      //   } else if (size === 's') {
      //     defaultCN += ' s';
      //   }
      // } else if (type === 'secondary') {
      //   defaultCN += ' secondary';
      //   if (size === 'm') {
      //     defaultCN += ' m';
      //   } else if (size === 's') {
      //     defaultCN += ' s';
      //   }
      // } else if (type === 'text') {
      //   defaultCN += ' text';
      // } else if (type === 'icon') {
      //   defaultCN += ' icon';
      // }
      defaultCN += ` ${type} ${size} ${className}`;
      return defaultCN;
    }, [className, type, size]);
    const handleClick = (e: SyntheticEvent) => {
      e.stopPropagation();
      onClick && onClick();
    };
    return (
      <button className={formatClassName} onClick={handleClick}>
        {/* {prefix && <img className="prefix" src={prefix} alt="" />} */}
        {/* {prefix} */}
        {/* {suffix && <img className="suffix" src={suffix} alt="" />} */}
        {/* {suffix} */}

        {type === 'icon' ? (
          icon
        ) : (
          <>
            <span className="btnText">{text}</span>
            {type === 'text' && <i className="iconfont icon-LinkArrow"></i>}
          </>
        )}
      </button>
    );
  }
);

export default PButton;
