import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setThemeAction } from '@/store/actions';
import type { Dispatch } from 'react';
import iconSun from '@/assets/newImg/temp/iconSun.svg';
import iconMoon from '@/assets/newImg/temp/iconMoon.svg';
import './index.scss';

const PSwitch: React.FC = ({}) => {
  const [color, setColor] = useState<string>('light');
  const dispatch: Dispatch<any> = useDispatch();
  const handleSwitch = () => {
    setColor((v) => {
      if (v === 'light') {
        return 'dark';
      } else {
        return 'light';
      }
    });
  };
  useEffect(() => {
    dispatch(setThemeAction(color));
  }, [color, dispatch]);
  return (
    <div className={`pSwitch ${color}`} onClick={handleSwitch}>
      {color === 'dark' ? (
        <img src={iconMoon} alt="" className="iconDark" />
      ) : (
        <img src={iconSun} alt="" className="iconLight" />
      )}
      {/* {color === 'dark' ? (
        <i className="iconfont icon-iconMoon"></i>
      ) : (
        <i className="iconfont icon-iconSun"></i>
      )} */}
    </div>
  );
};

export default PSwitch;
