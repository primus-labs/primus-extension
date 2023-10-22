import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { WALLETLIST } from '@/config/constants';
import type { WALLETITEMTYPE } from '@/config/constants';
import PBack from '@/components/PBack';
import PMask from '@/components/PMask';
import PSelect from '@/components/PSelect';
import PBottomErrorTip from '@/components/PBottomErrorTip';
import { DATASOURCEMAP } from '@/config/constants';
import { formatNumeral } from '@/utils/utils';
import iconGreater from '@/assets/img/iconGreater.svg';
import iconInfoGray from '@/assets/img/iconInfoGray.svg';
import iconWalletMetamask from '@/assets/img/iconWalletMetamask.svg';

import type { CredTypeItemType } from '@/types/cred';
import type { ExchangeMeta } from '@/types/dataSource';
import type { UserState } from '@/types/store';
import type { ConnectSourceType } from '@/types/dataSource';
import type { PROOFTYPEITEM, AttestionForm } from '@/types/cred';

import './index.sass';

interface AttestationDialogProps {
  type: string;
  onClose: () => void;
  onSubmit: (form: AttestionForm) => void;
  onCheck?: () => void;
  activeCred?: CredTypeItemType;
  activeSourceName?: string;
  onBack?: () => void;
}
const supportAssetCredList = ['binance', 'okx'];
const supportTokenCredList = ['binance', 'okx', 'coinbase'];
const sourcesLabel = {
  ASSETS_PROOF: 'Assets',
  TOKEN_HOLDINGS: 'Tokens',
  IDENTIFICATION_PROOF: 'Identity',
  UNISWAP_PROOF: 'Assets',
};

const AttestationDialog: React.FC<AttestationDialogProps> = memo(
  ({ type, onClose, onSubmit, activeCred, activeSourceName, onBack }) => {
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');

    const [activeSource, setActiveSource] = useState<ConnectSourceType>();
    const [activeToken, setActiveToken] = useState<string>('');
    const [activeBaseValue, setActiveBaseValue] = useState<string>('');
    const [errorTip, setErrorTip] = useState<string>();

    const exSources = useSelector((state: UserState) => state.exSources);
    const kycSources = useSelector((state: UserState) => state.kycSources);
    const sysConfig = useSelector((state: UserState) => state.sysConfig);
    const proofTypes = useSelector((state: UserState) => state.proofTypes);
    const walletAddress = useSelector(
      (state: UserState) => state.walletAddress
    );

    const navigate = useNavigate();

    const emptyCon = useMemo(() => {
      let el;
      switch (type) {
        case 'ASSETS_PROOF':
          el = (
            <>
              <p>You haven’t connected data from Binance and OKX.</p>
              <p>Please go to the Data page to add.</p>
            </>
          );
          break;
        case 'TOKEN_HOLDINGS':
          el = (
            <>
              <p>You haven’t connected data from Binance, Coinbase, and OKX.</p>
              <p>Please go to the Data page to add.</p>
            </>
          );
          break;
        case 'IDENTIFICATION_PROOF':
          el = (
            <>
              <p>You haven’t connected any identity data.</p>
              <p>Please go to the Data page to add.</p>
            </>
          );
          break;
      }
      return el;
    }, [type]);
    const tokenLogoPrefix = useMemo(() => {
      return sysConfig.TOKEN_LOGO_PREFIX;
    }, [sysConfig]);
    const activeAttestationTypeInfo = useMemo(() => {
      const obj = proofTypes.find((i) => i.credIdentifier === type);
      return obj as PROOFTYPEITEM;
    }, [type, proofTypes]);
    const connectedExSourceList: ConnectSourceType[] = useMemo(() => {
      return Object.keys(exSources).map((key) => {
        const sourceInfo: ExchangeMeta =
          DATASOURCEMAP[key as keyof typeof DATASOURCEMAP];
        const { name, icon } = sourceInfo;
        const { exUserId, label } = exSources[key];
        const infoObj: ConnectSourceType = {
          name,
          icon,
          exUserId,
          label,
        };
        return infoObj;
      });
    }, [exSources]);
    const connectedKYCSourceList: ConnectSourceType[] = useMemo(() => {
      return Object.keys(kycSources).map((key) => {
        const sourceInfo: ExchangeMeta =
          DATASOURCEMAP[key as keyof typeof DATASOURCEMAP];
        const { name, icon } = sourceInfo;
        const { exUserId, label } = kycSources[key];
        const infoObj: ConnectSourceType = {
          name,
          icon,
          exUserId,
          label,
        };
        return infoObj;
      });
    }, [kycSources]);
    const activeConnectedSourceList: ConnectSourceType[] = useMemo(() => {
      if (type === 'IDENTIFICATION_PROOF') {
        return connectedKYCSourceList;
      } else if (type === 'ASSETS_PROOF') {
        return connectedExSourceList.filter((i) =>
          supportAssetCredList.includes(i.name.toLowerCase())
        );
      } else if (type === 'TOKEN_HOLDINGS') {
        return connectedExSourceList.filter((i) =>
          supportTokenCredList.includes(i.name.toLowerCase())
        );
      } else if (type === 'UNISWAP_PROOF') {
        return WALLETLIST.filter((i: WALLETITEMTYPE) => !i.disabled);
      } else {
        return connectedExSourceList;
      }
    }, [connectedExSourceList, connectedKYCSourceList, type]);
    const tokenList = useMemo(() => {
      let list: string[] = [];
      if (type !== 'TOKEN_HOLDINGS') {
        return [];
      }
      if (!activeSource?.name) {
        const reduceF = (prev: string[], curr: any) => {
          const { tokenListMap } = curr;
          const curTokenList = Object.keys(tokenListMap);
          prev.concat([...curTokenList]);
          curTokenList.forEach((token) => {
            if (!prev.includes(token)) {
              prev.push(token);
            }
          });
          return prev;
        };
        list = Object.values(exSources).reduce(reduceF, []);
      } else {
        const sourceLowerCaseName = activeSource.name.toLowerCase();
        list = Object.keys(exSources[sourceLowerCaseName].tokenListMap);
      }
      const formatList = list.map((i) => ({
        text: i,
        value: i,
        icon: `${tokenLogoPrefix}icon${i}.png`,
      }));
      return formatList;
    }, [exSources, activeSource, tokenLogoPrefix, type]);
    const activeSourceList = useMemo(() => {
      if (activeToken) {
        const reduceF = (prev: string[], curr: any) => {
          const { tokenListMap, name } = curr;
          const curTokenList = Object.keys(tokenListMap);
          if (curTokenList.includes(activeToken)) {
            prev.push(name);
          }
          return prev;
        };
        const alist = Object.values(exSources).reduce(reduceF, []);
        return alist;
      } else {
        return [];
      }
    }, [exSources, activeToken]);
    const baseValueArr = useMemo(() => {
      if (activeAttestationTypeInfo.credIdentifier === 'ASSETS_PROOF') {
        const baseValArr = JSON.parse(
          activeAttestationTypeInfo.credProofConditions
        );
        return baseValArr;
      } else {
        return [];
      }
    }, [activeAttestationTypeInfo]);
    const baseValueList = useMemo(() => {
      return baseValueArr.map((i: string) => {
        return {
          text: '$' + i,
          value: i,
        };
      });
    }, [baseValueArr]);

    const handleChangeSelect = useCallback((val: string) => {
      if (!val) {
        setActiveSource(undefined);
      }
      setActiveToken(val);
      // setActiveSource(undefined);
    }, []);
    const handleChangeSelectBaseValue = useCallback((val: string) => {
      if (!val) {
        setActiveBaseValue('');
      }
      setActiveBaseValue(val);
    }, []);
    const handleClickNext = async () => {
      if (activeConnectedSourceList.length === 0) {
        navigate('/datas');
      }

      if (activeConnectedSourceList.length > 0) {
        if (!activeSource) {
          setErrorTip('Please select one data source');
          return;
        }
        const form: AttestionForm = {
          source: activeSource.name.toLowerCase(),
          type,
          exUserId: activeSource?.exUserId,
          label: activeSource?.label,
        };

        if (type === 'TOKEN_HOLDINGS') {
          if (!activeToken) {
            setErrorTip('Please select one token');
            return;
          } else {
            form.token = activeToken;
          }
        }
        if (type === 'ASSETS_PROOF') {
          if (!activeBaseValue) {
            setErrorTip('Please select one baseValue');
            return;
          } else {
            form.baseValue = activeBaseValue;
          }
        }

        if (type === 'IDENTIFICATION_PROOF') {
          // credential?: string;
          const sourceLowerCaseName = activeSource.name.toLowerCase();
          const res = await chrome.storage.local.get([sourceLowerCaseName]);
          form.credential = JSON.parse(res[sourceLowerCaseName]).credential;
          form.userIdentity = walletAddress;
          form.verifyIdentity = walletAddress;
          form.proofType = type;
        }
        if (type === 'UNISWAP_PROOF') {
          // TODO
        }
        if (activeCred?.requestid) {
          form.requestid = activeCred?.requestid;
          onSubmit(form);
        } else {
          onSubmit(form);
        }
      }
    };
    const handleClickData = (item: ConnectSourceType) => {
      if (type === 'TOKEN_HOLDINGS' && !activeToken) {
        return;
      }
      if (activeSourceName) {
        return;
      }
      if ((activeCred || activeSourceName) && activeSource) {
        if (activeSource?.name !== item.name) {
          return;
        }
      }

      if (!activeCred && activeSource?.name === item.name) {
        setActiveSource(undefined);
        return;
      }
      if (
        (activeSourceList.length > 0 && activeSourceList.includes(item.name)) ||
        activeSourceList.length === 0
      ) {
        setActiveSource(item);
      }
    };
    const liClassNameCallback = useCallback(
      (item: ConnectSourceType) => {
        let defaultClassName = 'networkItem';
        if ((activeCred || activeSourceName) && activeSource) {
          if (activeSource?.name !== item.name) {
            defaultClassName += ' disabled';
          }
        } else {
          if (activeSourceList.length > 0) {
            // if (activeSourceList.includes(item.name)) {
            //   defaultClassName += ' excitable';
            // }
            if (!activeSourceList.includes(item.name)) {
              defaultClassName += ' disabled';
            }
          }
        }
        if (activeSourceList.length > 0) {
          if (activeSourceList.includes(item.name)) {
            defaultClassName += ' excitable';
          }
        }
        if (activeSource?.name === item.name) {
          defaultClassName += ' active';
        }
        if (type !== 'ASSETS_PROOF' && !activeToken) {
          defaultClassName += ' disabled';
        }
        return defaultClassName;
      },
      [
        activeSource,
        activeSourceList,
        activeCred,
        activeSourceName,
        activeToken,
        type,
      ]
    );

    useEffect(() => {
      if (activeSourceName) {
        const sourceInfo = activeConnectedSourceList.find(
          (i) => i.name.toLowerCase() === activeSourceName.toLowerCase()
        );
        setActiveSource(sourceInfo);
      }
    }, [activeSourceName, activeConnectedSourceList]);
    useEffect(() => {
      if (activeCred) {
        const sourceInfo = activeConnectedSourceList.find(
          (i) => i.name.toLowerCase() === activeCred.source.toLowerCase()
        );
        setActiveSource(sourceInfo);
        if (type === 'TOKEN_HOLDINGS') {
          activeCred.holdingToken && setActiveToken(activeCred.holdingToken);
        }
      }
    }, [activeCred, type, activeConnectedSourceList]);

    useEffect(() => {
      if (activeAttestationTypeInfo.credIdentifier === 'ASSETS_PROOF') {
        const baseValArr = JSON.parse(
          activeAttestationTypeInfo.credProofConditions
        );
        if (baseValArr.length === 1) setActiveBaseValue(baseValArr[0]);
      }
    }, [activeAttestationTypeInfo]);
    useEffect(() => {
      if (baseValueArr.length === 1) setActiveBaseValue(baseValueArr[0]);
    }, [baseValueArr]);

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog attestationDialog">
          {!!onBack && <PBack onBack={onBack} />}
          <main>
            <h1>{activeAttestationTypeInfo.credTitle}</h1>
            {/* <h2>{activeAttestationTypeInfo.credDetails}</h2> */}
            <div className="scrollList">
              <div className="contItem">
                <div className="label">Proof content</div>
                <div className="value">
                  <div className="desc">
                    {activeAttestationTypeInfo.credProofContent}
                    {type === 'ASSETS_PROOF' && (
                      <img src={iconGreater} className="iconGreater" alt="" />
                    )}
                  </div>
                  {type === 'ASSETS_PROOF' && (
                    <div
                      className={
                        baseValueArr.length === 1 ? 'con' : 'con conList'
                      }
                    >
                      {/* formatNumeral(baseValueArr[0], {
                          decimalPlaces: 0,
                        }) */}

                      {baseValueArr.length === 1 ? (
                        '$' + baseValueArr[0]
                      ) : (
                        <div>
                          <PSelect
                            options={baseValueList}
                            onChange={handleChangeSelectBaseValue}
                            val={activeBaseValue}
                            prefix="$"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {type === 'TOKEN_HOLDINGS' && (
                    <div className="pSelectWrapper">
                      <PSelect
                        showIcon={true}
                        options={tokenList}
                        onChange={handleChangeSelect}
                        val={activeToken}
                      />
                    </div>
                  )}
                  {type === 'IDENTIFICATION_PROOF' && (
                    <div className="con identification">
                      {activeAttestationTypeInfo.credProofConditions}
                    </div>
                  )}
                  {type === 'UNISWAP_PROOF' && (
                    <div className="con uniswap">
                      {activeAttestationTypeInfo.credProofConditions}
                    </div>
                  )}
                </div>
                {type === 'UNISWAP_PROOF' && (
                  <div className="uniswapContentExtra">
                    The largests swap transaction from Uniswap on Ethereum
                  </div>
                )}
              </div>
              <div className="contItem contItemAssets">
                <div className="label">
                  Source of {sourcesLabel[type as keyof typeof sourcesLabel]}
                </div>
                {activeConnectedSourceList.length > 0 && (
                  <ul className="dataList">
                    {activeConnectedSourceList.map((item) => {
                      return (
                        <li
                          className={liClassNameCallback(item)}
                          key={item.name}
                          onClick={() => {
                            handleClickData(item);
                          }}
                        >
                          <img src={item.icon} alt="" />
                          <h6>{item.name}</h6>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {activeConnectedSourceList.length === 0 && (
                  <div className="emptyContent">
                    <img src={iconInfoGray} alt="" />
                    <h2>{emptyCon}</h2>
                  </div>
                )}
              </div>
            </div>
          </main>
          {activeConnectedSourceList.length === 0 ? (
            <button className="nextBtn gray" onClick={handleClickNext}>
              <span>OK</span>
            </button>
          ) : (
            <button className="nextBtn" onClick={handleClickNext}>
              {errorTip && <PBottomErrorTip text={errorTip} />}
              <span>Next</span>
            </button>
          )}
        </div>
      </PMask>
    );
  }
);

export default AttestationDialog;
