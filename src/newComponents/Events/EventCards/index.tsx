import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import SplicedIcons from '@/newComponents/SplicedIcons';
import iconPado from '@/assets/newImg/events/iconPado.svg';
import './index.scss';

type NavItem = {
  id: string;
  combineType: string;
  parterIcon?: any;

  periodType: string;
  chainDesc?: string;
  period?: any;

  picTxt: string;

  title: string;
  desc: string;
  gift: string;
};
interface PDropdownProps {
  onClick?: (item: NavItem) => void;
  list: NavItem[];
}
const Cards: React.FC<PDropdownProps> = memo(
  ({ list, onClick = (item: NavItem) => {} }) => {
    const checkIsActive = (i) => {
      if (i.periodType === '1') {
        return true;
      }
      if (i.periodType === '0') {
        return false; // TODO-newui
      }
    };
    const handleJoin = (i) => {
      onClick(i);
    };
    return (
      <ul className="currentEventsCards">
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
                  <div
                    className={`picContent ${
                      i.combineType === '1' && 'combine'
                    }`}
                  >
                    <SplicedIcons
                      list={
                        i.combineType === '1'
                          ? [i.parterIcon, iconPado]
                          : [iconPado]
                      }
                    />
                    <span>{i.picTxt}</span>
                  </div>
                  {!checkIsActive(i) && <div className="endMask">END</div>}
                </div>
                <div className="txtWrapper">
                  <div className="title">{i.title}</div>
                  <div className="descItems">
                    {i.periodType === '1' && (
                      <div className="descItem">
                        <i className="iconfont icon-iconBlockChain"></i>
                        <span>{i.chainDesc}</span>
                      </div>
                    )}
                    {i.periodType === '0' && (
                      <div className="descItem">
                        <i className="iconfont icon-iconCalendar"></i>
                        <span>{JSON.stringify(i.period)}</span>
                      </div>
                    )}
                    <div className="descItem">
                      <i className="iconfont icon-iconGift"></i>
                      <span>{i.gift}</span>
                    </div>
                  </div>
                  <div className="desc">{i.desc}</div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }
);

export default Cards;
