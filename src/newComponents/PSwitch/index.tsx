import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setThemeAction } from '@/store/actions';
import type { Dispatch } from 'react';
import iconSun from '@/assets/newImg/temp/iconSun.svg';
import iconMoon from '@/assets/newImg/temp/iconMoon.svg';
import './index.scss';
import { UserState } from '@/types/store';

const PSwitch: React.FC = ({}) => {
  const dispatch: Dispatch<any> = useDispatch();
  const theme = useSelector((state: UserState) => state.theme);
  const handleSwitch = useCallback((t) => {
    let newColor;
    if (t === 'light') {
      localStorage.setItem('colorTheme', 'dark');
      newColor = 'dark';
    } else {
      localStorage.setItem('colorTheme', 'light');
      newColor = 'light';
    }
    dispatch(setThemeAction(newColor));
  }, []);

  return (
    <div
      className={`pSwitch ${theme}`}
      onClick={() => {
        handleSwitch(theme);
      }}
    >
      {theme === 'dark' ? (
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
