import React, { memo, useMemo } from 'react';
import type { SyntheticEvent } from 'react';
import './index.scss';

interface PButtonProps {
  disabled?: boolean;
  className?: string;
  type?: string;
  text?: any;
  size?: string;
  icon?: any;
  onClick: () => void;
  loading?: boolean;

  prefix?: any;
  suffix?: any;
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
    disabled = false,
    loading = false,
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
      if (type) {
        defaultCN += ` ${type}`;
      }
      if (size) {
        defaultCN += ` ${size}`;
      }
      if (disabled) {
        defaultCN += ` disabled`;
      }
      if (className) {
        defaultCN += ` ${className}`;
      }
      // defaultCN += ` ${type} ${size} ${disabled && 'disabled'} ${className}`;
      return defaultCN;
    }, [className, type, size, disabled]);
    const handleClick = (e: SyntheticEvent) => {
      e.stopPropagation();
      if (disabled) {
      } else {
        onClick && onClick();
      }
    };
    return (
      <button className={formatClassName} onClick={handleClick}>
        {/* {prefix && <img className="prefix" src={prefix} alt="" />} */}
        {/* {prefix} */}
        {/* {suffix && <img className="suffix" src={suffix} alt="" />} */}
        {/* {suffix} */}
        {prefix}
        {type === 'icon' ? (
          icon
        ) : loading ? (
          <>
            {type === 'text' ? (
              <>
                <span className="btnText">{text}</span>
                <div className="spinnerWrapper">
                  <div className="loading-spinner"></div>
                </div>
              </>
            ) : (
              <div className="spinnerWrapper">
                <div className="loading-spinner"></div>
              </div>
            )}
          </>
        ) : (
          <>
            <span className="btnText">{text}</span>
            {type === 'text' &&
              (suffix ?? <i className="iconfont icon-LinkArrow"></i>)}
          </>
        )}
        {/* {type === 'icon' ? (
          icon
        ) : (
          <>
            {loading ? (
              <div className="spinnerWrapper">
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <span className="btnText">{text}</span>
            )}
            {type === 'text' && suffix && (
              <i className="iconfont icon-LinkArrow"></i>
            )}
          </>
        )} */}
      </button>
    );
  }
);

export default PButton;
