import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import type { SyntheticEvent } from 'react';
import { useSelector } from 'react-redux';

import { DATASOURCEMAP } from '@/config/constants';
import { PADOADDRESS } from '@/config/envConstants';
import {
  getCurrentDate,
  formatNumeral,
  formatAddress,
  formatTime,
} from '@/utils/utils';

import iconExpand from '@/assets/img/iconExpand.svg';
import iconUpChain from '@/assets/img/iconUpChain.svg';
import iconQRCode from '@/assets/img/iconQRCode.svg';
import iconBind from '@/assets/img/iconBind.svg';
import iconSuc2 from '@/assets/img/iconSuc2.svg';
import iconGreater from '@/assets/img/iconGreater.svg';
import iconMedalAssets from '@/assets/img/iconMedalAssets.svg';
import iconMedalToken from '@/assets/img/iconMedalToken.svg';

import type { PROOFTYPEITEM } from '@/types/cred';
import type { UserState } from '@/store/reducers';

import './index.sass';
import { div } from '../../../utils/utils';
import iconPolygonID from '@/assets/img/iconPolygonID.svg';

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
  getDataTime: string;
  baseValue: string;
  balanceGreaterThanBaseValue: string; // or bool statusNormal
  signature: string; // includes v，r，s
  encodedData: string; // trueHash or falseHash

  exUserId: string;
  user: {
    userid: string;
    address: string;
    token: string;
  };
  did?: string;
};

interface CredTypeListProps {
  item: CredTypeItemType;
  onUpChain: (item: CredTypeItemType) => void;
  onViewQrcode: (item: CredTypeItemType) => void;
  onBindPolygonID: (item: CredTypeItemType) => void;
  onUpdate: (item: CredTypeItemType) => void;
  onDelete: (item: CredTypeItemType) => void;
}
const CredItem: React.FC<CredTypeListProps> = memo(
  ({ item, onUpChain, onViewQrcode, onBindPolygonID, onUpdate, onDelete }) => {
    // console.log('credItem', item);

    const [dorpdownVisible, setDorpdownVisible] = useState<boolean>(false);
    const [expand, setExpand] = useState(false);
    const sysConfig = useSelector((state: UserState) => state.sysConfig);
    const proofTypes = useSelector((state: UserState) => state.proofTypes);

    const tokenLogoPrefix = useMemo(() => {
      return sysConfig.TOKEN_LOGO_PREFIX;
    }, [sysConfig]);
    const otherOperations = useMemo(() => {
      if (item?.provided?.length && item?.provided?.length > 0) {
        return ['Delete'];
      }
      return ['Update', 'Delete'];
    }, [item]);
    const briefTypeName = useMemo(() => {
      const obj = proofTypes.find(
        (i: PROOFTYPEITEM) => i.credTitle === item.type
      );
      return obj?.simplifiedName;
    }, [proofTypes, item.type]);

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
      debugger;
      onViewQrcode(item);
    };
    const handleClickOther = (e: SyntheticEvent) => {
      e.stopPropagation();
    };
    const handleClickBind = (e: SyntheticEvent) => {
      e.stopPropagation();
      onBindPolygonID(item);
    };
    // const handleEnterBind = () => {
    //   setDorpdownVisible(true);
    // };
    // const handleLeaveBind = () => {
    //   setDorpdownVisible(false);
    // };

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
    const nameCallback = useCallback((item: CredTypeItemType) => {
      if (item.exUserId) {
        return `ID: ${item.exUserId}`;
      }
      if (item.label) {
        return `Label: ${item.label}`;
      }
      const sourceName = item?.source;

      if (sourceName) {
        const sourceLowerCaseName = item.source.toLowerCase();
        return DATASOURCEMAP[sourceLowerCaseName].name;
      }
      return null;
    }, []);

    return (
      <div className={expand ? 'credItem expand' : 'credItem'}>
        <div
          className={
            item.type === 'Assets Proof' ? 'main' : 'main tokenHolding'
          }
          onClick={handleClick}
        >
          <div className="mainContent">
            <div className="con">
              <div className="conl">
                {item.type === 'Assets Proof' ? (
                  <img src={iconMedalAssets} alt="" />
                ) : (
                  <img src={iconMedalToken} alt="" />
                )}
                {briefTypeName}
              </div>
              <div className="conr">
                <div className="conrItem">
                  <div className="value">{nameCallback(item)}</div>
                  <img src={iconCallback(item)} alt="" className="sourceIcon" />
                </div>
                <div className="conrItem">
                  <div className="value">
                    {getCurrentDate(Number(item?.getDataTime))}
                  </div>
                  <img src={iconSuc2} alt="" className="sourceIcon" />
                </div>
              </div>
            </div>
            <footer>
              <div className="providedChains">
                {item.provided?.map((i, k) => (
                  <a
                    href={`https://sepolia.easscan.org/attestation/view/${i.attestationUID}`}
                    target="_blank"
                    rel="noreferrer"
                    key={k}
                  >
                    <img src={i.icon} alt="" />
                  </a>
                ))}
              </div>
              <div className="operations">
                <div className="iconWrapper">
                  <div className="descTip">
                    <span>Provide on-chain</span>
                  </div>
                  <img src={iconUpChain} alt="" onClick={handleUpChain} />
                </div>
                <img src={iconQRCode} alt="" onClick={handleViewQrcode} />
                <div className="iconWrapper">
                  <div className="descTip">
                    <span>Bind to Polygon ID</span>
                  </div>
                  <img
                    src={iconBind}
                    className="iconBind"
                    alt=""
                    onClick={handleClickBind}
                  />
                </div>
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
        </div>
        {dorpdownVisible && (
          <ul
            className="dropdown"
            onClick={handleEnterAvatar}
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
                  <div className="desc">Balance of assets</div>
                  <div className="con">
                    {/* <i className="greaterSymbol">&gt;</i> */}
                    <img src={iconGreater} className="iconGreater" alt="" />$
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
                      <img
                        src={`${tokenLogoPrefix}icon${item.holdingToken}.png`}
                        alt=""
                        className="tokenImg"
                      />
                    )}
                    <span>{item.holdingToken}</span>
                  </div>
                </div>
              )}
            </div>
            {item.did ? (
              <div className="descItem arow">
                <div className="label">Recipient Account</div>
                <div className="value">
                  <img
                    src={iconPolygonID}
                    alt=""
                  />
                  {/* TODO */}
                  <span>{formatAddress(item.did)}</span>
                </div>
              </div>
            ) : (
              <div className="descItem arow">
                <div className="label">Recipient Address</div>
                <div className="value">{formatAddress(item.address)}</div>
              </div>
            )}
            <div className="descItem">
              <div className="label">Attested By</div>
              <div className="value">
                <div className="desc">PADO</div>
                <div className="con">{formatAddress(PADOADDRESS)}</div>
              </div>
            </div>
            <div className="descItem arow">
              <div className="label">Attested Time</div>
              <div className="value">
                {formatTime(Number(item?.getDataTime))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default memo(CredItem);
