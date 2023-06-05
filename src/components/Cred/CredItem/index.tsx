import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import type { SyntheticEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DATASOURCEMAP } from '@/config/constants';
import { PADOADDRESS } from '@/config/envConstants';

import { getCurrentDate, formatNumeral, formatAddress } from '@/utils/utils';
import type { UserState } from '@/store/reducers';
import iconExpand from '@/assets/img/iconExpand.svg';
import iconUpChain from '@/assets/img/iconUpChain.svg';
import iconQRCode from '@/assets/img/iconQRCode.svg';
import './index.sass';

export type CredTypeItemType = {
  type: string;
  // name: string;
  // id: string;
  label: string;
  // date: string;
  provided?: any[];
  expand?: boolean;
  holdingToken?: string;

  requestid: string;
  version: string;
  source: string;
  authUseridHash: string;
  address: string;
  getdatatime: string;
  baseValue: string;
  balanceGreaterBaseValue: string; // or bool statusNormal
  signature: string; // includes v，r，s
  encodedData: string; // trueHash or falseHash

  exUserId: string;
  user: {
    userid: string;
    address: string;
    token: string;
  };
};

interface CredTypeListProps {
  item: CredTypeItemType;
  onUpChain: (item: CredTypeItemType) => void;
  onViewQrcode: (item: CredTypeItemType) => void;
  onUpdate: (item: CredTypeItemType) => void;
  onDelete: (item: CredTypeItemType) => void;
}
const CredItem: React.FC<CredTypeListProps> = ({
  item,
  onUpChain,
  onViewQrcode,
  onUpdate,
  onDelete,
}) => {
  // console.log('credItem',item)
  const [dorpdownVisible, setDorpdownVisible] = useState<boolean>(false);
  const [expand, setExpand] = useState(false);
  const sysConfig = useSelector((state: UserState) => state.sysConfig);
  const tokenLogoPrefix = useMemo(() => {
    return sysConfig.TOKEN_LOGO_PREFIX;
  }, [sysConfig]);
  const otherOperations = useMemo(() => {
    if (item?.provided?.length && item?.provided?.length > 0) {
      return ['Delete'];
    }
    return ['Update', 'Delete'];
  }, [item]);
  const handleClick = () => {
    setExpand((flag) => !flag);
  };
  const handleClickDropdownItem = (operation: string) => {
    // setActiveItem(operation);
    if (operation === 'Update') {
      onUpdate(item);
    } else if (operation === 'Delete') {
      onDelete(item);
    }
  };
  const handleEnterAvatar = () => {
    setDorpdownVisible(true);
  };
  const handleLeaveAvatar = () => {
    setDorpdownVisible(false);
  };
  const handleUpChain = (e: SyntheticEvent) => {
    e.stopPropagation();
    onUpChain(item);
  };
  const handleViewQrcode = (e: SyntheticEvent) => {
    e.stopPropagation();
    onViewQrcode(item);
  };
  const handleClickOther = (e: SyntheticEvent) => {
    e.stopPropagation();
  };
  useEffect(() => {
    if (item.expand) {
      setExpand(true);
    }
  }, [item]);
  const iconCallback = useCallback((item: CredTypeItemType) => {
    const sourceName = item?.source;
    if (sourceName) {
      const sourceLowerCaseName = item.source.toLowerCase();
      return DATASOURCEMAP[sourceLowerCaseName].icon;
    }
    return null;
  }, []);

  return (
    <div className={expand ? 'credItem expand' : 'credItem'}>
      <div
        className={item.type === 'Assets Proof' ? 'main' : 'main tokenHolding'}
        onClick={handleClick}
      >
        <h1>{item.type}</h1>
        <div className="sourceInfo">
          <div className="descItem">
            <div className="label">Source: &nbsp;</div>
            <div className="value">
              <img src={iconCallback(item)} alt="" className="sourceIcon" />
              <span>{item?.source}</span>
            </div>
          </div>
          {(item.exUserId || item.label) && (
            <div className="descItem">
              <div className="label">ID: &nbsp;</div>
              <div className="value">{item?.exUserId ?? item.label}</div>
            </div>
          )}
        </div>
        <div className="descItem">
          <div className="label">Date: &nbsp;</div>
          <div className="value">
            {getCurrentDate(Number(item?.getdatatime))}
          </div>
        </div>
        <footer>
          <div className="providedChains">
            {item.provided?.map((i, k) => (
              <a
                href={`https://sepolia.easscan.org/attestation/view/${i.attestationUID}`}
                target="_blank"
              >
                <img src={i.icon} key={k} alt="" />
              </a>
            ))}
          </div>
          <div className="operations">
            <img src={iconUpChain} alt="" onClick={handleUpChain} />
            <img src={iconQRCode} alt="" onClick={handleViewQrcode} />
            <div
              className="iconOtherWrapper"
              onClick={handleClickOther}
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
          {otherOperations.map((item) => {
            return (
              <li
                key={item}
                className="dropdownItem"
                onClick={() => {
                  handleClickDropdownItem(item);
                }}
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
                <div className="con">
                  $
                  {item.baseValue
                    ? formatNumeral(item.baseValue, {
                        decimalPlaces: 0,
                      })
                    : ''}
                </div>
              </div>
            ) : (
              <div className="value">
                <div className="desc">Hold this kind of Token:</div>
                <div className="con">
                  {/* TODO */}
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
            <div className="value">{formatAddress(item.user.address)}</div>
          </div>
          <div className="descItem">
            <div className="label">Attested By</div>
            <div className="value">
              <div className="desc">PADO</div>
              <div className="con">{formatAddress(PADOADDRESS)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(CredItem);
