import React, { memo, useMemo, useCallback } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import {list} from '@/config/menu'
import './index.scss';

interface PButtonProps {}


const Nav: React.FC<PButtonProps> = memo(({}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  console.log('pathname', pathname)
  const formatList = useMemo(() => {
    return [...list];
  }, []);
  const formatOptionCN = useCallback((item) => {
    let str = 'navItem';
    if (item?.disabled) {
      str += ' disabled';
    }
    if (pathname.startsWith(item.link)) {
      str += ' active';
    }
    return str;
  }, [pathname]);
  const handleClickOption = (item) => {
    if (item.disabled) {
      return;
    }
    if (item.link) {
      navigate(item.link);
    }
  };
  const handleEnter = (item) => {
    item.toBeActive = true;
  };
  const handleLeave = (item) => {};
  return (
    <div className="navWrapper">
      <ul className="navItems">
        {formatList.map((item) => {
          return (
            <li
              className={formatOptionCN(item)}
              key={item.value}
              onClick={() => {
                handleClickOption(item);
              }}
              onMouseEnter={() => {
                handleEnter(item);
              }}
              onMouseLeave={() => {
                handleLeave(item);
              }}
            >
              {item.iconName ? (
                <i
                  className={`iconfont ${
                    item.link === pathname ? item.iconName+'Active': item.iconName
                  }`}
                ></i>
              ) : item.icon ? (
                <img src={item.icon} alt="" />
              ) : undefined}
              <div className="desc">{item.label}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});

export default Nav;
