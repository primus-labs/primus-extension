import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import type { SyntheticEvent } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';

import { DATASOURCEMAP } from '@/config/constants';
import { PADOADDRESS, EASInfo } from '@/config/envConstants';
import {
  getCurrentDate,
  formatNumeral,
  formatAddress,
  formatTime,
} from '@/utils/utils';
import PDropdownList from '@/components/PDropdownList';
import iconExpand from '@/assets/img/iconExpand.svg';
import iconUpChain from '@/assets/img/iconUpChain.svg';
import iconQRCode from '@/assets/img/iconQRCode.svg';
import iconBind from '@/assets/img/iconBind.svg';
import iconSuc2 from '@/assets/img/iconSuc2.svg';
import iconGreater from '@/assets/img/iconGreater.svg';
import iconMedalAssets from '@/assets/img/iconMedalAssets.svg';
import iconMedalToken from '@/assets/img/iconMedalToken.svg';
import iconMedalIdentification from '@/assets/img/iconMedalIdentification.svg';
import iconPolygonID from '@/assets/img/iconPolygonID.svg';
import iconUpdate from '@/assets/img/credit/iconUpdate.svg';
import iconClear from '@/assets/img/credit/iconClear.svg';

import type { PROOFTYPEITEM, CredTypeItemType } from '@/types/cred';
import type { UserState } from '@/types/store';

import './index.scss';

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
    // console.log('CredItem', item);
    const [dorpdownVisible, setDorpdownVisible] = useState<boolean>(false);
    const [expand, setExpand] = useState(false);
    const sysConfig = useSelector((state: UserState) => state.sysConfig);
    const proofTypes = useSelector((state: UserState) => state.proofTypes);

    const tokenLogoPrefix = useMemo(() => {
      return sysConfig.TOKEN_LOGO_PREFIX;
    }, [sysConfig]);
    const otherOperations = useMemo(() => {
      if (item?.provided?.length && item?.provided?.length > 0) {
        return [
          {
            icon: iconClear,
            text: 'Delete',
          },
        ];
      }
      return [
        {
          icon: iconClear,
          text: 'Delete',
        },
        {
          icon: iconUpdate,
          text: 'Update',
        },
      ];
    }, [item]);
    const activeTypeConfig = useMemo(() => {
      const obj = proofTypes.find(
        (i: PROOFTYPEITEM) => i.credIdentifier === item.type
      );
      return obj;
    }, [proofTypes, item.type]);
    const briefTypeName = useMemo(() => {
      if (item.reqType === 'web') {
        return item.uiTemplate?.title;
      } else {
        return activeTypeConfig?.simplifiedName;
      }
    }, [activeTypeConfig, item.uiTemplate, item.reqType]);
    const credProofContent = useMemo(() => {
      return activeTypeConfig?.credProofContent;
    }, [activeTypeConfig]);
    const credProofConditions = useMemo(() => {
      return activeTypeConfig?.credProofConditions;
    }, [activeTypeConfig]);
    const credIcon = useMemo(() => {
      let imgNode = iconMedalAssets;
      switch (item.type) {
        case 'ASSETS_PROOF':
          imgNode = iconMedalAssets;
          break;
        case 'TOKEN_HOLDINGS':
          imgNode = iconMedalToken;
          break;
        case 'IDENTIFICATION_PROOF':
          imgNode = iconMedalIdentification;
          break;
      }
      return imgNode;
    }, [item.type]);
    const navigate = useNavigate();

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
    const handleClickBind = (e: SyntheticEvent) => {
      e.stopPropagation();
      if (item.did || item.reqType === 'web') {
        return;
      }
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
      if (item.reqType === 'web') {
        const idx = item?.host?.indexOf('.');
        const formatHost = item?.host?.substring((idx as number) + 1);
        return formatHost;
      }
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
            item.type === 'TOKEN_HOLDINGS' ? 'main tokenHolding' : 'main'
          }
          onClick={handleClick}
        >
          <div className="mainContent">
            <div className="con">
              <div className="conl">
                {/* <img src={credIcon} alt="" /> */}

                <span>{briefTypeName}</span>
                {item.did && <img src={iconPolygonID} alt="" />}
              </div>
              <div className="conr">
                <div className="conrItem">
                  <img src={iconCallback(item)} alt="" className="sourceIcon" />
                  <div className="value">{nameCallback(item)}</div>
                </div>
                <div className="conrItem">
                  <img src={iconSuc2} alt="" className="sourceIcon" />
                  <div className="value">
                    {getCurrentDate(Number(item?.getDataTime))}
                  </div>
                </div>
              </div>
            </div>
            <footer>
              <div className="providedChains">
                {item.provided?.map((i, k) => (
                  <a
                    href={`${
                      (EASInfo[i.title as keyof typeof EASInfo] as any)
                        ?.transactionDetailUrl
                    }/${i.attestationUID}`}
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
                  {/* <div className="descTip">
                    <span>Provide on-chain</span>
                  </div> */}
                  <img src={iconUpChain} alt="" onClick={handleUpChain} />
                </div>
                <img src={iconQRCode} alt="" onClick={handleViewQrcode} />
                <div
                  className={
                    item.reqType === 'web' || item.did
                      ? 'iconWrapper disabled'
                      : 'iconWrapper'
                  }
                >
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
          <div
            className="dropdownWrapper"
            onMouseEnter={handleEnterAvatar}
            onMouseLeave={handleLeaveAvatar}
          >
            <PDropdownList
              list={otherOperations}
              onClick={handleClickDropdownItem}
            />
          </div>
        )}

        {expand && (
          <div className="extra">
            <div className="descItem">
              <div className="label">Proof Content</div>
              <div className="value">
                {item.type === 'ASSETS_PROOF' && <>Spot Amount</>}
                {item.type === 'TOKEN_HOLDINGS' && (
                  <div className="value">
                    {tokenLogoPrefix && (
                      <img
                        src={`${tokenLogoPrefix}icon${item.holdingToken}.png`}
                        alt=""
                        className="tokenImg"
                      />
                    )}
                    <span>{item.holdingToken}</span>
                  </div>
                )}
                {item.type === 'IDENTIFICATION_PROOF' && (
                  // TODO!!!
                  <div className="value">
                    {item.reqType === 'web'
                      ? item.uiTemplate.proofContent
                      : 'KYC Status'}
                  </div>
                )}
              </div>
            </div>
            <div className="descItem">
              <div className="label">Proof Result</div>
              {item.type === 'ASSETS_PROOF' && (
                <div className="value">
                  <img src={iconGreater} className="iconGreater" alt="" />$
                  {item.baseValue
                    ? formatNumeral(item.baseValue, {
                        decimalPlaces: 0,
                      })
                    : ''}
                </div>
              )}
              {item.type === 'TOKEN_HOLDINGS' && (
                <div className="value">
                  <img src={iconGreater} className="iconGreater" alt="" />
                  <span>0</span>
                </div>
              )}
              {item.type === 'IDENTIFICATION_PROOF' &&
                item.reqType === 'web' && (
                  <div className="value">
                    {item.uiTemplate.subProofContent &&
                      item.uiTemplate.subProofContent + ' '}
                    {item.uiTemplate.condition}
                  </div>
                )}
              {item.type === 'IDENTIFICATION_PROOF' &&
                item.reqType !== 'web' && (
                  <div className="value">{credProofConditions}</div>
                )}
            </div>
            <div className="descItem">
              <div className="label">Data Source ID</div>
              <div className="value">
                {item?.sourceUseridHash
                  ? formatAddress('0x' + item.sourceUseridHash, 6)
                  : 'N/A'}
              </div>
            </div>
            <div className="descItem">
              <div className="label">Connected Account</div>
              <div className="value">
                {item.did
                  ? formatAddress(item.did.toLowerCase(), 13)
                  : formatAddress(item.address)}
              </div>
            </div>
            <div className="descItem">
              <div className="label">Attested By PADO</div>
              <div className="value">
                {item.did
                  ? formatAddress(
                      (item?.issuer?.toLowerCase() || '') as string,
                      13
                    )
                  : formatAddress(PADOADDRESS)}
              </div>
            </div>
            <div className="descItem">
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
