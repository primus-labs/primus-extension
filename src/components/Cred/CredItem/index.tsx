import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { UserState } from '@/store/reducers';
import iconExpand from '@/assets/img/iconExpand.svg';
import iconUpChain from '@/assets/img/iconUpChain.svg';
import iconQRCode from '@/assets/img/iconQRCode.svg';
import './index.sass';

export type CredTypeItemType = {
  type: string;
  icon: any;
  name: string;
  id: string;
  label: string;
  date: string;
  provided: any[];
  expand?: boolean;
};

interface CredTypeListProps {
  item: CredTypeItemType;
}
const CredItem: React.FC<CredTypeListProps> = ({ item }) => {
  const [dorpdownVisible, setDorpdownVisible] = useState<boolean>(false);
  const [expand, setExpand] = useState(false);
  const sysConfig = useSelector((state: UserState) => state.sysConfig);
  const tokenLogoPrefix = useMemo(() => {
    return sysConfig.TOKEN_LOGO_PREFIX;
  }, [sysConfig]);
  const [activeItem,setActiveItem] = useState<string>()
  const [navs, setNavs] = useState(['Update', 'Delete']);
  const handleClick = () => {
    setExpand((flag) => !flag);
  };
  const handleClickOther = () => {};
  const handleClickDropdownItem = (item: string) => {
    setActiveItem(item)
  };
  const handleEnterAvatar = () => {
    setDorpdownVisible(true);
  };
  const handleLeaveAvatar = () => {
    setDorpdownVisible(false);
  };
  useEffect(() => {
    if (item.expand) {
      setExpand(true);
    }
  }, [item]);
  return (
    <div className="credItem">
      <div
        className={item.type === 'Assets Proof' ? 'main' : 'main tokenHolding'}
        onClick={handleClick}
      >
        <h1>{item.type}</h1>
        <div className="sourceInfo">
          <div className="descItem">
            <div className="label">Source: &nbsp;</div>
            <div className="value">
              <img src={item?.icon} alt="" className="sourceIcon" />
              <span>{item?.name}</span>
            </div>
          </div>
          {(item.id || item.label) && (
            <div className="descItem">
              <div className="label">ID: &nbsp;</div>
              <div className="value">{item?.id ?? item.label}</div>
            </div>
          )}
        </div>
        <div className="descItem">
          <div className="label">Date: &nbsp;</div>
          <div className="value">{item?.date}</div>
        </div>
        <footer>
          <div className="providedChains">
            {item.provided.map((i) => (
              <img src={i} />
            ))}
          </div>
          <div className="operations">
            <img src={iconUpChain} alt="" />
            <img src={iconQRCode} alt="" />
            <div
              className="iconOtherWrapper"
              onMouseEnter={handleEnterAvatar}
              onMouseLeave={handleLeaveAvatar}
            >
              <img src={iconExpand} className="iconOther" alt="" />
            </div>
          </div>
        </footer>
      </div>
      {dorpdownVisible && (
        <ul
          className="dropdown"
          onMouseEnter={handleEnterAvatar}
          onMouseLeave={handleLeaveAvatar}
        >
          {navs.map((item) => {
            return (
              <li
                key={item}
                className="dropdownItem"
                onClick={() => {handleClickDropdownItem(item)}}
              >
                {item}
              </li>
            );
          })}
        </ul>
      )}
      {expand && (
        <div className="extra">
          <div className="descItem">
            <div className="label">Proof Content</div>
            {item.type === 'Assets Proof' ? (
              <div className="value">
                <div className="desc">Assets balance greater than</div>
                <div className="con">$1,000</div>
              </div>
            ) : (
              <div className="value">
                <div className="desc">Hold this kind of Token:</div>
                <div className="con">
                  {tokenLogoPrefix && (
                    <img src={`${tokenLogoPrefix}iconBTC.png`} alt="" />
                  )}
                  <span>BTC</span>
                </div>
              </div>
            )}
          </div>
          <div className="descItem arow">
            <div className="label">Recipient Add</div>
            <div className="value">0x009d...02fa</div>
          </div>
          <div className="descItem">
            <div className="label">Attested By</div>
            <div className="value">
              <div className="desc">PADO</div>
              <div className="con">0x1234...opiu</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CredItem;
