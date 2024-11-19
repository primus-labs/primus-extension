import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import SplicedIcons from '@/newComponents/SplicedIcons';
import iconPado from '@/assets/img/content/iconPado.svg';
import './index.scss';
dayjs.extend(utc);
type NavItem = {
  id: string;
  img: any;

  title: string;
  desc: string;
  link?: string;
  linkIcon?: any;
};
interface PDropdownProps {
  list: NavItem[];
}
const Cards: React.FC<PDropdownProps> = memo(({ list }) => {
  const checkIsActive = (i) => {
    if (i.periodType === '1') {
      return true;
    }
    if (i.periodType === '0') {
      return false;
    }
  };
  const formatPeriod = (period) => {
    const { startTime, endTime } = period;
    const s = dayjs.utc(+startTime).format('MMM.D,YYYY');
    const e = dayjs.utc(+endTime).format('MMM.D,YYYY');
    return `${s}-${e}`;
  };
  const handleJoin = (i) => {};
  return (
    <ul className="rewardCards">
      {list.map((i) => {
        return (
          <li
            className="dataSourceCard"
            onClick={() => {
              handleJoin(i);
            }}
            key={i.id}
          >
            <div className="cardContent">
              <div className="picWrapper">
                <img src={i.img} alt="" />
              </div>
              <div className="txtWrapper">
                <div className="title">{i.title}</div>
                <div className="desc">
                  <img src={iconPado} alt="" />
                  <p>{i.desc}</p>
                </div>
              </div>
            </div>
            {i.link && (
              <a href={i.link} target="_blank" className="iconLink">
                <img src={i.linkIcon} alt="" />
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
});

export default Cards;
